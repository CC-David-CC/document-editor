import assert from 'node:assert/strict';import {validateTable} from '../apps/system/document-editor/table-validation.mjs';
const cell=(attrs={})=>({type:'tableCell',attrs,content:[{type:'paragraph'}]}),row=(...cells)=>({type:'tableRow',content:cells}),table=(...rows)=>({type:'table',content:rows});
assert.doesNotThrow(()=>validateTable(table(row(cell({rowspan:2}),cell({colspan:2})),row(cell(),cell()))));
assert.doesNotThrow(()=>validateTable(table(row(cell({rowspan:2,colspan:2})),{type:'tableRow'})));

for(const doc of [table(row(cell({rowspan:10000}))),table(row(cell({rowspan:2}))),table(row(cell({colspan:129}))),table(row(cell({colspan:0}))),table(row(cell(),cell()),row(cell())),table(row(cell(),cell({rowspan:2})),row(cell({colspan:2})))])assert.throws(()=>validateTable(doc));
console.log('PASS rectangular merged grids and bounded invalid row/column spans');
