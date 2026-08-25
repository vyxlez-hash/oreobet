import { Copy, CheckCircle2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "../App";
import { useDemoStore, demoStore } from "../store/demo";

export function WalletPage(){
 const {balance,transactions}=useDemoStore(); const [coin,setCoin]=useState("LTC"); const [created,setCreated]=useState(false); const [copied,setCopied]=useState(false);
 const addresses={LTC:"LTC_DEPOSIT_ADDRESS_HERE",ETH:"ETH_DEPOSIT_ADDRESS_HERE",SOL:"SOL_DEPOSIT_ADDRESS_HERE"};
 const copy=()=>{setCopied(true);navigator.clipboard?.writeText(addresses[coin as keyof typeof addresses]);setTimeout(()=>setCopied(false),1300)}
 return <section><PageTitle eyebrow="WALLET" title="Your wallet" sub="Deposit requests and account activity."/>
 <div className="wallet-grid"><div className="balance-card"><span>Available balance</span><strong>${balance.toFixed(2)}</strong><div className="wallet-actions"><button className="primary-btn"><ArrowDownToLine size={15}/> Deposit</button><button className="secondary-btn"><ArrowUpFromLine size={15}/> Withdraw</button></div></div>
 <div className="panel"><div className="panel-title">Deposit</div><div className="coin-tabs">{["LTC","ETH","SOL"].map(c=><button className={coin===c?"active":""} onClick={()=>setCoin(c)} key={c}>{c}</button>)}</div><div className="address-box"><span>{addresses[coin as keyof typeof addresses]}</span><button onClick={copy}>{copied?<CheckCircle2 size={16}/>:<Copy size={16}/>}</button></div><button className="primary-btn full" onClick={()=>{demoStore.depositRequest(100);setCreated(true)}}>Create deposit request</button></div></div>
 {created&&<div className="success-card"><div className="success-check"><CheckCircle2 size={26}/></div><div><strong>Deposit request created</strong><p>Your deposit request has been created. Status: Pending.</p></div><button onClick={()=>setCreated(false)}>Close</button></div>}
 <div className="panel table"><div className="panel-title">Recent transactions</div>{transactions.map(t=><div className="table-row" key={t.id}><span>{t.id}</span><strong>{t.type}</strong><span>${t.amount.toFixed(2)}</span><span className="status">{t.status}</span></div>)}</div>
 </section>
}
