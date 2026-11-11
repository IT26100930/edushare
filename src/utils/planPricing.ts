export function savingPercent(monthly:number,total:number,months:number):number {
  if(!Number.isFinite(monthly)||monthly<=0||!Number.isFinite(total)||total<0)return 0;
  return Math.max(0,Math.round((1-total/(monthly*months))*100));
}
export function discountedTotal(monthly:number,months:number,percent:number):number {
  return Math.round(monthly*months*(1-Math.min(100,Math.max(0,percent))/100));
}
export function studentMonthlyPrice(monthly:number,percent:number):number {
  return discountedTotal(monthly,1,percent);
}
