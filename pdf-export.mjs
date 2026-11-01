/** Render the supported document schema to an actual, selectable-text PDF. */
import pdfMake from 'pdfmake/build/pdfmake.js';
import fonts from 'pdfmake/build/vfs_fonts.js';
import {validateTable} from './table-validation.mjs';
import notoRegular from './fonts/NotoSans-Regular.ttf';
import notoItalic from './fonts/NotoSans-Italic.ttf';
import notoBold from './fonts/NotoSans-Bold.ttf';
import notoBoldItalic from './fonts/NotoSans-BoldItalic.ttf';
pdfMake.vfs=fonts;
const safeUrl=url=>{try{return ['http:','https:','mailto:'].includes(new URL(url).protocol);}catch{return false;}};
// Common character maps of the four bundled faces; recheck when fonts change.
const outsideRoboto=/[^\u0009-\u000a\u000d\u0020-\u007e\u00a0-\u017f\u018f\u0192\u01a0-\u01a1\u01af-\u01b0\u01f0\u01fa-\u01ff\u0218-\u021b\u0237\u0384-\u038a\u038c\u038e-\u03a1\u03a3-\u03ce\u03d1-\u03d2\u03d6\u2000-\u200b\u2010-\u2011\u2013-\u2015\u2017-\u201e\u2020-\u2022\u2025-\u2027\u2030\u2032-\u2033\u2039-\u203a\u203c\u2044\u2070\u2074-\u208e\u20ac\u2202\u2206\u220f\u2211-\u2212\u221a\u221e\u222b\u2248\u2260\u2264-\u2265]/u;
const outsideNotoLatin=/[^\u0020-\u007e\u00a0-\u024f\u0300-\u036f\u1e00-\u1eff]/u;
const fallbackLatin=/^\p{Script=Latin}\p{Mark}*$/u;
function unsupported(text){const cp=text.codePointAt(0).toString(16).toUpperCase().padStart(4,'0');throw Error('PDF export contains unsupported characters (U+'+cp+').');}
let notoVfs;
async function loadNoto(){
 return notoVfs??=Promise.all(Object.entries({'NotoSans-Regular.ttf':notoRegular,'NotoSans-Italic.ttf':notoItalic,'NotoSans-Bold.ttf':notoBold,'NotoSans-BoldItalic.ttf':notoBoldItalic}).map(async([name,url])=>{const response=await fetch(url);if(!response.ok)throw Error('Could not load the PDF fallback font.');const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return [name,btoa(binary)];})).then(Object.fromEntries).catch(error=>{notoVfs=null;throw error;});
}
function inline(node,used){
 if(node.type==='hardBreak')return [{text:'\n'}];
 if(node.type!=='text')throw Error('PDF export cannot handle inline '+node.type+'.');
 const result={text:node.text||''};const decorations=new Set();for(const mark of node.marks||[]){if(mark.type==='bold')result.bold=true;else if(mark.type==='italic')result.italics=true;else if(mark.type==='underline')decorations.add('underline');else if(mark.type==='strike')decorations.add('lineThrough');else if(mark.type==='link'){if(!safeUrl(mark.attrs?.href))throw Error('A link uses an unsupported address.');result.link=mark.attrs.href;result.color='#245d9a';decorations.add('underline');}else throw Error('PDF export cannot handle '+mark.type+' formatting.');}if(decorations.size)result.decoration=[...decorations];
 if(!outsideRoboto.test(result.text))return [result];
 if(typeof Intl.Segmenter!=='function')throw Error('This browser cannot safely select PDF fallback fonts.');
 const runs=[];for(const {segment} of new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(result.text)){
  let font;if(!outsideRoboto.test(segment))font='Roboto';else if(fallbackLatin.test(segment)&&!outsideNotoLatin.test(segment)){font='NotoSans';used.noto=true;}else unsupported(segment);
  const last=runs.at(-1);if(last?.font===font)last.text+=segment;else runs.push({...result,text:segment,font});
 }
 return runs;
}
function block(node,imageSizes,maxWidth=480,used={noto:false}){
 switch(node.type){
  case 'paragraph':return {text:(node.content||[]).flatMap(child=>inline(child,used)),margin:[0,0,0,8]};
  case 'heading':return {text:(node.content||[]).flatMap(child=>inline(child,used)),fontSize:node.attrs?.level===1?22:node.attrs?.level===2?17:14,bold:true,margin:[0,10,0,8]};
  case 'image':{
   const src=node.attrs?.src||'';if(!/^data:image\/(png|jpeg);base64,/i.test(src))throw Error('PDF supports PNG and JPEG images.');
   const size=imageSizes.get(src);if(!size)throw Error('An image could not be decoded for PDF export.');
   // CSS pixels map to points at 96 dpi. Reduce oversized images to fit the
   // page, but never enlarge a small image to fill the page.
   const width=size.width*.75,height=size.height*.75,scale=Math.min(1,maxWidth/width,550/height);
   return {image:src,width:width*scale,margin:[0,4,0,10]};}
  case 'pageBreak':return {text:'',pageBreak:'after'};
  case 'bulletList':case 'orderedList':{
   const start=node.attrs?.start??1;
   if(node.type==='orderedList'&&!Number.isSafeInteger(start))throw Error('PDF export requires a valid ordered-list start number.');
   return {[node.type==='bulletList'?'ul':'ol']:(node.content||[]).map(item=>({stack:(item.content||[]).map(child=>block(child,imageSizes,Math.max(1,maxWidth-20),used))})),...(node.type==='orderedList'?{start}:{}),margin:[0,0,0,8]};}
  case 'table':{
   const rows=node.content||[],widths=Math.max(...rows.map(r=>(r.content||[]).reduce((n,c)=>n+(c.attrs?.colspan||1),0)),0);if(!widths)throw Error('Empty tables cannot be exported.');
   const occupied=[];const body=rows.map((row,y)=>{const cells=Array(widths).fill(null);let x=0;for(const cell of row.content||[]){while(occupied[y]?.[x]){cells[x]='';x++;}const colSpan=cell.attrs?.colspan||1,rowSpan=cell.attrs?.rowspan||1;const cellWidth=Math.max(1,maxWidth*colSpan/widths-12);const value={stack:(cell.content||[]).map(child=>block(child,imageSizes,cellWidth,used)),...(cell.type==='tableHeader'?{bold:true,fillColor:'#eff4f8'}:{}),...(colSpan>1?{colSpan}:{}),...(rowSpan>1?{rowSpan}:{})};for(let yy=y;yy<y+rowSpan;yy++){occupied[yy]??=[];for(let xx=x;xx<x+colSpan;xx++){if(occupied[yy][xx])throw Error('Overlapping table cells cannot be exported.');occupied[yy][xx]=true;if(yy===y&&xx>x)cells[xx]='';}}cells[x]=value;x+=colSpan;}for(let j=0;j<widths;j++)if(cells[j]===null)cells[j]='';return cells;});
   return {table:{headerRows:rows[0]?.content?.every(c=>c.type==='tableHeader')?1:0,widths:Array(widths).fill('*'),body},layout:'lightHorizontalLines',margin:[0,0,0,10]};}
  default:throw Error('PDF export does not support '+node.type+'.');
 }
}
export async function makePdf(document){
 if(document?.type!=='doc'||!Array.isArray(document.content))throw Error('Invalid document.');
 const sources=new Set();const collect=node=>{if(node.type==='table')validateTable(node);if(node.type==='image')sources.add(node.attrs?.src||'');for(const child of node.content||[])collect(child);};document.content.forEach(collect);
 const imageSizes=new Map();for(const src of sources){if(!/^data:image\/(png|jpeg);base64,/i.test(src))throw Error('PDF supports PNG and JPEG images.');const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('An image could not be decoded for PDF export.'));img.src=src;});if(!img.naturalWidth||!img.naturalHeight)throw Error('An image could not be decoded for PDF export.');imageSizes.set(src,{width:img.naturalWidth,height:img.naturalHeight});}
 const used={noto:false},content=document.content.map(node=>block(node,imageSizes,480,used));
 const definition={pageSize:'A4',pageMargins:[54,55,54,55],defaultStyle:{font:'Roboto',fontSize:11},content};
 const fontMap={Roboto:{normal:'Roboto-Regular.ttf',bold:'Roboto-Medium.ttf',italics:'Roboto-Italic.ttf',bolditalics:'Roboto-MediumItalic.ttf'},NotoSans:{normal:'NotoSans-Regular.ttf',bold:'NotoSans-Bold.ttf',italics:'NotoSans-Italic.ttf',bolditalics:'NotoSans-BoldItalic.ttf'}};
 const vfs=used.noto?{...fonts,...await loadNoto()}:fonts;
 return new Promise((resolve,reject)=>{try{pdfMake.createPdf(definition,null,fontMap,vfs).getBuffer(buffer=>resolve(new Uint8Array(buffer)));}catch(error){reject(error);}});
}
