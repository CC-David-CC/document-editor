// Reject broken imported grids before ProseMirror or the PDF renderer allocates
// based on their spans. A valid table has one rectangular set of cells.
export function validateTable(table) {
 const rows=table.content;
 if(!Array.isArray(rows)||rows.length<1||rows.length>5000)throw Error('Report tables must have 1 to 5,000 rows.');
 const span=(cell,key)=>{const n=cell?.attrs?.[key]??1;if(!Number.isSafeInteger(n)||n<1||n>5000)throw Error('Report table cell spans must be whole numbers between 1 and 5,000.');return n;};
 const first=rows[0]?.content??[];
 if(rows[0]?.type!=='tableRow'||!Array.isArray(first))throw Error('Invalid report table row.');
 let width=0;
 for(const cell of first){width+=span(cell,'colspan');if(width>128)throw Error('Report tables are limited to 128 columns.');}
 if(!width)throw Error('Report tables must have at least one column.');
 const occupied=Array(width).fill(0);
 for(let y=0;y<rows.length;y++){
  const row=rows[y],cells=row?.content??[];if(row?.type!=='tableRow'||!Array.isArray(cells))throw Error('Invalid report table row.');let x=0;
  for(const cell of cells){
   if(!['tableCell','tableHeader'].includes(cell?.type))throw Error('Invalid report table cell.');
   while(x<width&&occupied[x]>0)x++;
   const columns=span(cell,'colspan'),height=span(cell,'rowspan');
   if(x+columns>width||y+height>rows.length)throw Error('Report table cells extend beyond the table.');
   for(let col=x;col<x+columns;col++){if(occupied[col])throw Error('Report table cells overlap.');occupied[col]=height;}
   x+=columns;
  }
  if(occupied.some(n=>n===0))throw Error('Report table has missing cells.');
  for(let col=0;col<width;col++)if(occupied[col])occupied[col]--;
 }
}
