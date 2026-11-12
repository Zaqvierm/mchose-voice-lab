import assert from 'node:assert/strict';
import {parse,serialize} from 'parse5';

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes || []) walk(child, visit);
}
const attr = (node,name) => node.attrs?.find(a=>a.name===name)?.value;
export function documentIds(html) {
  const ids=[];walk(parse(html),node=>{const id=attr(node,'id');if(id)ids.push(id);});
  return ids.sort();
}
export function prerender(html, translate, models) {
  const before=documentIds(html), document=parse(html);
  walk(document,node=>{
    const key=attr(node,'data-i18n');
    if(key){
      const value=translate(key);
      if(!value||value===key)throw new Error(`Missing prerender copy: ${key}`);
      node.childNodes=[{nodeName:'#text',value,parentNode:node}];
    }
    if(attr(node,'id')==='model-select'){
      node.childNodes=models.map(model=>{
        const option={nodeName:'option',tagName:'option',namespaceURI:'http://www.w3.org/1999/xhtml',attrs:model==='MCHOSE X9'?[{name:'selected',value:''}]:[],childNodes:[],parentNode:node};
        option.childNodes=[{nodeName:'#text',value:model,parentNode:option}];return option;
      });
    }
  });
  const result=serialize(document);
  assert.deepEqual(documentIds(result),before,'Prerender must preserve every application field ID');
  return result;
}
