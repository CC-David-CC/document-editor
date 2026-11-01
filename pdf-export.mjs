/** Render the supported document schema to an actual, selectable-text PDF. */
import pdfMake from 'pdfmake/build/pdfmake.js';
import fonts from 'pdfmake/build/vfs_fonts.js';
pdfMake.vfs=fonts;
const safeUrl=url=>{try{return ['http:','https:','mailto:'].includes(new URL(url).protocol);}catch{return false;}};
function inline(node){
 if(node.type==='hardBreak')return {text:'\n'};
 if(node.type!=='text')throw Error('PDF export cannot handle inline '+node.type+'.');
 // The added Greek, superscript/subscript and math ranges are present in all
 // four bundled Roboto font faces. Unsupported glyphs still fail explicitly.
 const result={text:node.text||''};if(/[^\u0000-\u024f\u0384-\u038a\u038c\u038e-\u03a1\u03a3-\u03ce\u03d1-\u03d2\u03d6\u2000-\u206f\u2070\u2074-\u208e\u20ac\u2202\u2206\u220f\u2211-\u2212\u221a\u221e\u222b\u2248\u2260\u2264-\u2265]/u.test(result.text))throw Error('PDF export currently supports Latin text and selected Greek and math symbols; this report contains unsupported characters.');for(const mark of node.marks||[]){if(mark.type==='bold')result.bold=true;else if(mark.type==='italic')result.italics=true;else if(mark.type==='link'){if(!safeUrl(mark.attrs?.href))throw Error('A link uses an unsupported address.');result.link=mark.attrs.href;result.color='#245d9a';result.decoration='underline';}else throw Error('PDF export cannot handle '+mark.type+' formatting.');}return result;
}
function block(node){
 switch(node.type){
  case 'paragraph':return {text:(node.content||[]).map(inline),margin:[0,0,0,8]};
  case 'heading':return {text:(node.content||[]).map(inline),fontSize:node.attrs?.level===1?22:node.attrs?.level===2?17:14,bold:true,margin:[0,10,0,8]};
  case 'image':if(!/^data:image\/(png|jpeg);base64,/i.test(node.attrs?.src||''))throw Error('PDF supports PNG and JPEG images.');return {image:node.attrs.src,fit:[480,550],margin:[0,4,0,10]};
  case 'pageBreak':return {text:'',pageBreak:'after'};
  case 'bulletList':case 'orderedList':return {[node.type==='bulletList'?'ul':'ol']:(node.content||[]).map(item=>({stack:(item.content||[]).map(block)})),margin:[0,0,0,8]};
  case 'table':{
   const rows=node.content||[],widths=Math.max(...rows.map(r=>(r.content||[]).reduce((n,c)=>n+(c.attrs?.colspan||1),0)),0);if(!widths)throw Error('Empty tables cannot be exported.');
   const occupied=[];const body=rows.map((row,y)=>{const cells=Array(widths).fill(null);let x=0;for(const cell of row.content||[]){while(occupied[y]?.[x]){cells[x]='';x++;}const colSpan=cell.attrs?.colspan||1,rowSpan=cell.attrs?.rowspan||1;const value={stack:(cell.content||[]).map(block),...(cell.type==='tableHeader'?{bold:true,fillColor:'#eff4f8'}:{}),...(colSpan>1?{colSpan}:{}),...(rowSpan>1?{rowSpan}:{})};for(let yy=y;yy<y+rowSpan;yy++){occupied[yy]??=[];for(let xx=x;xx<x+colSpan;xx++){if(occupied[yy][xx])throw Error('Overlapping table cells cannot be exported.');occupied[yy][xx]=true;if(yy===y&&xx>x)cells[xx]='';}}cells[x]=value;x+=colSpan;}for(let j=0;j<widths;j++)if(cells[j]===null)cells[j]='';return cells;});
   return {table:{headerRows:rows[0]?.content?.every(c=>c.type==='tableHeader')?1:0,widths:Array(widths).fill('*'),body},layout:'lightHorizontalLines',margin:[0,0,0,10]};}
  default:throw Error('PDF export does not support '+node.type+'.');
 }
}
export async function makePdf(document){
 if(document?.type!=='doc'||!Array.isArray(document.content))throw Error('Invalid document.');
 const definition={pageSize:'A4',pageMargins:[54,55,54,55],defaultStyle:{font:'Roboto',fontSize:11},content:document.content.map(block)};
 return new Promise((resolve,reject)=>{try{pdfMake.createPdf(definition).getBuffer(buffer=>resolve(new Uint8Array(buffer)));}catch(error){reject(error);}});
}
