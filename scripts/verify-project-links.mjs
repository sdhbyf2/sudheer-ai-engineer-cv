import { expect } from '@playwright/test';

export async function verifyProjectLinks(page, engine, base) {
 for (const id of ['rag','voice','edge']) {
  await page.locator(`.role-fit a[href="#project-${id}"]`).click();
  const project=page.locator(`#project-${id}`);
  await expect(project.locator('.project-detail')).toBeVisible();
  await expect(project).toBeFocused();
  await expect(page).toHaveURL(new RegExp(`#project-${id}$`));
  await expect.poll(()=>project.evaluate(el=>Math.round(el.getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().bottom))).toBeGreaterThanOrEqual(15);
  await expect.poll(()=>project.evaluate(el=>Math.round(el.getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().bottom))).toBeLessThan(35);
  await project.getByRole('button',{name:/Close case study:/}).click();
 }
 const reader=await page.context().newPage();
 try {
  for (const id of ['rag','voice','edge']) {
   await reader.goto(new URL('#project-'+id,base).href,{waitUntil:'networkidle'});
   await expect(reader.locator(`#project-${id} .project-detail`)).toBeVisible();
  }
  await reader.reload({waitUntil:'networkidle'});
  await expect(reader.locator('#project-edge .project-detail')).toBeVisible();
  await reader.locator('.role-fit a[href="#project-rag"]').click();
  await expect(reader.locator('#project-rag .project-detail')).toBeVisible();
  await reader.goBack();
  await expect(reader.locator('#project-edge .project-detail')).toBeVisible();
  if(engine==='chromium') {
   await page.context().grantPermissions(['clipboard-read','clipboard-write']);
   await reader.locator('#project-edge .case-share button').click();
   expect(await reader.evaluate(()=>navigator.clipboard.readText())).toBe(new URL('#project-edge',base).href);
   await expect(reader.locator('#project-edge .case-share [role="status"]')).toHaveText('Case study link copied.');
   await reader.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Unavailable in test');}}}));
   await reader.locator('#project-edge .case-share button').click();
   await expect(reader.locator('#project-edge .case-share a')).toHaveAttribute('href','#project-edge');
  }
 } finally {await reader.close();}
 console.log(`PASS ${engine}: three role-to-project links, section offsets, direct arrivals, reload, history and ${engine==='chromium'?'clipboard/fallback':'case-study expansion'}.`);
}
