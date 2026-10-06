/** Splits valid editorial HTML without cutting a tag, entity, comment or table/list item. */
export function splitHtmlAtCursor(html: string, cursor: number): [string,string] {
  if (!Number.isInteger(cursor) || cursor<0 || cursor>html.length) throw new Error('Posição do cursor inválida.');
  const tokens=html.matchAll(/<!--[\s\S]*?-->|<\/?[a-zA-Z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/g);
  const stack:{name:string;tag:string}[]=[];
  const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for(const m of tokens){
    if(m.index>=cursor)break;
    if(m.index+m[0].length>cursor)throw new Error('Posicione o cursor fora de uma tag ou bloco.');
    if(m[0].startsWith('<!--'))continue;
    const name=m[0].match(/^<\/?([\w-]+)/)![1].toLowerCase();
    if(m[0].startsWith('</')){if(stack.at(-1)?.name===name)stack.pop();else throw new Error('Corrija o HTML antes de inserir o bloco.');}
    else if(!voids.has(name) && !m[0].endsWith('/>'))stack.push({name,tag:m[0]});
  }
  const before=html.slice(0,cursor);
  if(before.lastIndexOf('<')>before.lastIndexOf('>') || /&[^;\s<]*$/.test(before))throw new Error('Posicione o cursor fora de uma tag ou entidade HTML.');
  if(stack.some(t=>!['p','div','section','article','span','strong','em','b','i','u'].includes(t.name)))throw new Error('Posicione o cursor em um parágrafo ou entre seções, fora de listas e tabelas.');
  return [before+[...stack].reverse().map(t=>`</${t.name}>`).join(''),stack.map(t=>t.tag).join('')+html.slice(cursor)];
}
export function splitHtmlInMiddle(html:string):[string,string]{
  const candidates=[...html.matchAll(/<\/(?:p|div|section|ul|ol|table|h[1-6])>/gi)].map(m=>m.index+m[0].length);
  candidates.sort((a,b)=>Math.abs(a-html.length/2)-Math.abs(b-html.length/2));
  for(const position of candidates){try{return splitHtmlAtCursor(html,position);}catch{ /* try a safe boundary */ }}
  return [html,'']; // Short/plain content: put the middle recommendation after the available text.
}
