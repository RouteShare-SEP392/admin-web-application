'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, PageHeader } from '@/components/ui/misc';
import { ReceiptsChart, type ReceiptBucket } from './receipts-chart';

const FEE_RATE = gql`query AdminPublishedTripFeeRate { adminSystemSettings { platformFeePercent } }`;

const REPORT = gql`query AdminDriverFeeReport($period: FeePeriod!, $date: DateTime!, $driverId: ID) {
  adminDriverFeeReport(period:$period,date:$date,driverId:$driverId) { start end cash transfer other unpaid fees net topups buckets { start cash transfer other } }
  driverFeePolicy { publishMode effectiveAt }
}`;
const PENDING = gql`query AdminPendingDriverFeeTopups($page: Int!) {
  adminPendingDriverFeeTopups(page:$page) { id driverId amount createdAt receivingAccount { bankName accountNumber accountHolder } }
}`;
const WALLET = gql`query AdminDriverFeeWallet($driverId: ID!, $page: Int!) {
  adminDriverFeeWallet(driverId:$driverId,page:$page) { balance entries { id kind amount createdAt note } }
}`;
const CONFIRM = gql`mutation ConfirmFeeTopup($id: ID!, $bankReference: String!, $receivedAmount: String!) {
  adminConfirmDriverFeeTopup(id:$id,bankReference:$bankReference,receivedAmount:$receivedAmount)
}`;
const POLICY = gql`mutation UpdateFeePolicy($mode: Int!) { adminSetDriverFeePolicy(mode:$mode) }`;
const ADJUST = gql`mutation AdjustFeeWallet($driverId: ID!, $requestId: ID!, $amount: String!, $reason: String!) {
  adminAdjustDriverFeeWallet(driverId:$driverId,requestId:$requestId,amount:$amount,reason:$reason)
}`;
const periods = { day:'Ngày', week:'Tuần', month:'Tháng', quarter:'Quý' };
const metrics = { cash:'Đã thu tiền mặt', transfer:'Đã thu VietQR', other:'Đã thu (chưa rõ phương thức)', unpaid:'Cước chưa thu', fees:'Phí đã trừ', net:'Thu nhập sau phí nền tảng', topups:'Đã nạp ví phí' };
const kinds: Record<string,string> = { TOP_UP:'Nạp phí', BOOKING_FEE:'Trừ phí chuyến', ADJUSTMENT:'Điều chỉnh' };
type Report = Record<keyof typeof metrics | 'start' | 'end',string> & {buckets: ReceiptBucket[]};
type Topup = { id:string; driverId:string; amount:string; createdAt:string; receivingAccount?: {bankName:string;accountNumber:string;accountHolder:string} | null };
type Wallet = { balance:string; entries:{id:string;kind:string;amount:string;createdAt:string;note?:string}[] };
const vnd = (amount: string) => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:2}).format(Number(amount));
const dateLabel = (date: string | number) => new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(date));
const input = 'rounded-md border border-line p-2';

export function DriverFeesView() {
  const [period,setPeriod] = useState('month');
  const [date,setDate] = useState(() => new Date(Date.now()+7*3600000).toISOString().slice(0,10));
  const [driver,setDriver] = useState('');
  const [selected,setSelected] = useState('');
  const [policyMessage,setPolicyMessage] = useState('');
  const feeRate = useQuery<{adminSystemSettings:{platformFeePercent:number}}>(FEE_RATE, {fetchPolicy:'network-only'});
  const rate = feeRate.data?.adminSystemSettings.platformFeePercent;
  const q = useQuery<{ adminDriverFeeReport:Report; driverFeePolicy:{publishMode:number;effectiveAt?:string} }>(REPORT,{variables:{period,date:`${date}T00:00:00+07:00`,driverId:selected||null},fetchPolicy:'network-only'});
  const [setPolicy,{loading:saving}] = useMutation(POLICY);
  const report = q.data?.adminDriverFeeReport;
  const policy = q.data?.driverFeePolicy;
  return <div className="space-y-4">
    <PageHeader title="Ví phí & Báo cáo tài xế" description="Đối soát tiền nạp, theo dõi số dư phí và thu chi theo kỳ Việt Nam." />
    <Card className="space-y-2 border-brand-200 bg-brand-50 p-5">
      <h2 className="font-semibold">Tỷ lệ phí nền tảng cho chuyến đăng mới</h2>
      <p className="text-3xl font-bold">{typeof rate === 'number' && !feeRate.error ? `${new Intl.NumberFormat('vi-VN').format(rate)}%` : feeRate.loading ? 'Đang tải…' : 'Chưa tải được'}</p>
      <p className="text-sm text-muted">Mức phí được lưu khi đăng chuyến. Đổi tỷ lệ không tính lại chuyến đã đăng hay khoản đã thu.</p>
      <Link className="inline-block rounded-md py-2 font-semibold text-brand-700 underline" href="/settings#platformFeePercent">Chỉnh tỷ lệ trong Cấu hình hệ thống</Link>
    </Card>
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold">Chính sách đăng chuyến</h2>
      <p>{policy ? policy.effectiveAt ? `Đang áp dụng chế độ ${policy.publishMode}` : 'Chưa kích hoạt thu phí' : 'Chưa tải được chính sách'}</p>
      {[0,1].map(mode => <Button key={mode} variant="secondary" disabled={!policy || saving || Boolean(policy.effectiveAt && policy.publishMode===mode)} onClick={async () => {
        if (!window.confirm(!policy?.effectiveAt ? 'Kích hoạt ghi phí cho booking mới?' : 'Đổi chế độ đăng chuyến?')) return;
        setPolicyMessage('');
        try { await setPolicy({variables:{mode}}); await q.refetch(); } catch { setPolicyMessage('Chưa cập nhật được. Hãy tải lại để kiểm tra.'); }
      }}>{mode===0 ? '0 – Chỉ nhắc nạp' : '1 – Chặn đăng mới khi hết số dư'}</Button>)}
      {policyMessage ? <p role="alert">{policyMessage}</p> : null}
    </Card>
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold">Báo cáo thu chi</h2>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Kỳ báo cáo" className={input} value={period} onChange={e=>setPeriod(e.target.value)}>{Object.entries(periods).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select>
        <input aria-label="Ngày trong kỳ" className={input} type="date" value={date} onChange={e=>{if(e.target.value)setDate(e.target.value);}} />
        <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();setSelected(driver.trim());}}>
          <input aria-label="ID tài xế" className={input} placeholder="ID tài xế hoặc bỏ trống" value={driver} onChange={e=>setDriver(e.target.value)} />
          <Button type="submit">Xem báo cáo</Button>
        </form>
      </div>
      <p>{selected ? `Tài xế: ${selected}` : 'Tổng hợp toàn hệ thống'}</p>
      {q.loading ? <p>Đang tải…</p> : q.error ? <p role="alert">Chưa tải được báo cáo. Kiểm tra lại ID tài xế hoặc kết nối.</p> : report ? <>
        <p>{dateLabel(report.start)} – {dateLabel(Date.parse(report.end)-1)}</p>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(Object.keys(metrics) as (keyof typeof metrics)[]).map(k=><div key={k} className="rounded border border-line p-3"><dt>{metrics[k]}</dt><dd className="font-semibold">{vnd(report[k])}</dd></div>)}</dl>
        <ReceiptsChart key={`${selected}:${period}:${report.start}`} buckets={report.buckets} period={period} />
        <p className="text-sm text-muted">Tiền nạp ví không phải doanh thu. Thu nhập sau phí nền tảng không phải lợi nhuận.</p>
      </> : null}
    </Card>
    {selected ? <WalletPanel key={selected} driverId={selected} onChange={()=>void q.refetch().catch(()=>{})} /> : null}
    <Topups onSelect={id=>{setDriver(id);setSelected(id);}} onConfirm={()=>void q.refetch().catch(()=>{})} />
  </div>;
}

function WalletPanel({driverId,onChange}:{driverId:string;onChange:()=>void}) {
  const [page,setPage]=useState(1);
  const [amount,setAmount]=useState('');
  const [reason,setReason]=useState('');
  const [requestId,setRequestId]=useState('');
  const [message,setMessage]=useState('');
  const q=useQuery<{adminDriverFeeWallet:Wallet}>(WALLET,{variables:{driverId,page},fetchPolicy:'network-only'});
  const [adjust,{loading}]=useMutation(ADJUST);
  const wallet=q.data?.adminDriverFeeWallet;
  return <Card className="space-y-3 p-5"><h2 className="font-semibold">Ví phí của tài xế</h2>
    {!wallet ? <p>{q.loading?'Đang tải…':'Chưa tải được ví tài xế.'}</p> : <>
      <p>Số dư: <strong>{vnd(wallet.balance)}</strong></p>
      {wallet.entries.map(entry=><p key={entry.id}>{dateLabel(entry.createdAt)} · {kinds[entry.kind]} · {vnd(entry.amount)} {entry.note}</p>)}
      {!wallet.entries.length ? <p>Không có giao dịch trên trang này.</p> : null}
      <Button disabled={page===1} onClick={()=>setPage(page-1)}>Trước</Button>{' '}<Button disabled={wallet.entries.length<30} onClick={()=>setPage(page+1)}>Sau</Button>
      <form className="flex flex-wrap gap-2" onSubmit={async e=>{
        e.preventDefault();
        if(!window.confirm('Ghi giao dịch điều chỉnh số dư?')) return;
        const id=requestId||crypto.randomUUID();setRequestId(id);setMessage('');
        try{await adjust({variables:{driverId,requestId:id,amount,reason}});setAmount('');setReason('');setRequestId('');onChange();await q.refetch();}
        catch{setMessage('Chưa xác nhận được điều chỉnh. Tải lại ví để kiểm tra.');}
      }}>
        <input required aria-label="Số tiền điều chỉnh" placeholder="Số tiền (+/-)" className={input} value={amount} onChange={e=>{setAmount(e.target.value);setRequestId('');}} />
        <input required maxLength={200} aria-label="Lý do" placeholder="Lý do điều chỉnh" className={input} value={reason} onChange={e=>{setReason(e.target.value);setRequestId('');}} />
        <Button type="submit" disabled={loading}>Ghi điều chỉnh</Button>
      </form>
      {message?<p role="alert">{message}</p>:null}
    </>}
  </Card>;
}

function Topups({onSelect,onConfirm}:{onSelect:(id:string)=>void;onConfirm:()=>void}) {
  const [page,setPage]=useState(1);
  const q=useQuery<{adminPendingDriverFeeTopups:Topup[]}>(PENDING,{variables:{page},fetchPolicy:'network-only'});
  const [confirm,{loading}]=useMutation(CONFIRM);
  const [message,setMessage]=useState('');
  const rows=q.data?.adminPendingDriverFeeTopups;
  return <Card className="space-y-3 p-5"><h2 className="font-semibold">Yêu cầu nạp chờ đối soát</h2>
    <p>Chỉ xác nhận sau khi đối chiếu tiền thực nhận trên sao kê ngân hàng của RouteShare.</p>
    {!rows ? <p>{q.loading?'Đang tải…':'Chưa tải được yêu cầu nạp.'}</p> : !rows.length ? <p>Không có yêu cầu trên trang này.</p> : null}
    {rows?.map(row=><form key={row.id} className="space-y-2 border-t border-line pt-3" onSubmit={async e=>{
      e.preventDefault();const form=new FormData(e.currentTarget);
      if(!window.confirm('Xác nhận đã đối chiếu khoản tiền thực nhận này?'))return;
      setMessage('');
      try { await confirm({variables:{id:row.id,bankReference:form.get('ref'),receivedAmount:form.get('amount')}});onConfirm();await q.refetch(); }
      catch { setMessage('Chưa xác nhận được. Kiểm tra số tiền và mã giao dịch trước khi thử lại.'); }
    }}>
      <p>{dateLabel(row.createdAt)} · {vnd(row.amount)} · Nội dung chuyển khoản: {row.id.replace(/-/g,'').toUpperCase()}</p>
      {row.receivingAccount ? <p className="text-sm text-muted">Đích nạp đã lưu: {row.receivingAccount.bankName} · {row.receivingAccount.accountNumber} · {row.receivingAccount.accountHolder}</p> : null}
      <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={()=>onSelect(row.driverId)}>Xem ví tài xế</Button>
        <input required name="ref" aria-label="Mã giao dịch ngân hàng" placeholder="Mã giao dịch ngân hàng" className={input} />
        <input required name="amount" aria-label="Tiền thực nhận" placeholder="Tiền thực nhận" inputMode="numeric" className={input} />
        <Button type="submit" disabled={loading}>Xác nhận nạp</Button>
      </div>
    </form>)}
    {message?<p role="alert">{message}</p>:null}
    <Button disabled={page===1 || q.loading} onClick={()=>setPage(page-1)}>Trước</Button>{' '}<Button disabled={!rows || rows.length<30 || q.loading} onClick={()=>setPage(page+1)}>Sau</Button>
  </Card>;
}
