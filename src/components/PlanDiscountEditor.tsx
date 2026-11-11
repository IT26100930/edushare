import React from 'react';
import {savingPercent,discountedTotal} from '../utils/planPricing';
type Props={prices:Record<string,number>;onChange:(values:Record<string,number>)=>void};
export function PlanDiscountEditor({prices,onChange}:Props){
 return <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 space-y-4 text-neutral-900 dark:text-neutral-100">
  <h4 className="font-bold">Plan discounts</h4><p className="text-sm text-neutral-600 dark:text-neutral-300">Set discounts against 5 or 12 regular monthly payments. Changing a discount updates the semester/yearly total above. Editing a total updates its displayed saving. Save Pricing Changes to publish.</p>
  <div className="grid sm:grid-cols-2 gap-4">{['premium','batch'].flatMap(plan=>['semester','yearly'].map(cycle=>{
   const months=cycle==='semester'?5:12, key=plan+(cycle==='semester'?'Semester':'Yearly');
   const base=prices[plan+'Monthly'], total=prices[key], rate=savingPercent(base,total,months);
   return <label key={key} className="text-sm font-semibold space-y-1 block">{plan==='premium'?'Premium':'Batch'} {cycle} discount (%)<input type="number" min={0} max={100} step={1} disabled={!base} value={rate} onChange={e=>{const value=e.target.valueAsNumber;if(Number.isFinite(value)&&value>=0&&value<=100)onChange({...prices,[key]:discountedTotal(base,months,value)});}} className="block w-full border rounded-lg p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"/><span className="block font-normal text-xs text-neutral-500 dark:text-neutral-300">Total: Rs. {total.toLocaleString()} · approx. {rate}% saving</span></label>;
  }))}</div>
  <label className="block text-sm font-semibold">Verified student monthly discount (%)<input type="number" min={0} max={100} step={1} value={prices.studentDiscountPercent} onChange={e=>{const rate=e.target.valueAsNumber;if(Number.isFinite(rate)&&rate>=0&&rate<=100)onChange({...prices,studentDiscountPercent:rate});}} className="block w-full border rounded-lg p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"/></label>
  <p className="text-xs text-neutral-500 dark:text-neutral-300">Student discount applies to the Premium monthly plan only. Semester/yearly savings are visible to guests and signed-in members alike. Discounts are not stacked.</p>
 </section>;
}
