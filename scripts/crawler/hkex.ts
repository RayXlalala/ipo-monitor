// HKEx 拟上市数据抓取（Application Proof / PHIP）
// 数据源：www1.hkexnews.hk/app/appindex.html（主板/GEM 同一页，通过 tab 切换）
import { chromium } from 'playwright';
import { Company, ReviewStatus } from '../../src/lib/types';

const CHROME_PATH = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const BASE_URL = 'https://www1.hkexnews.hk/app';

interface HkexRow {
  date: string; // DD/MM/YYYY
  name: string;
  id: string;
  market: 'hk-main' | 'hk-gem';
  status: ReviewStatus;
  documents: { type: string; url: string; date: string }[];
}

function parseDate(ddmmyyyy: string): string | undefined {
  const m = ddmmyyyy.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return undefined;
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function stripSuffix(name: string): string {
  // 去掉 HKEx 标记后缀：-B (Biotech), -W (WVR), -P (Pre-Commercial), -S (Secondary)
  return name.replace(/\s*-\s*[BWPS]\s*$/i, '').trim();
}

function buildId(market: 'hk-main' | 'hk-gem', rowId: string): string {
  return `hk:${market === 'hk-main' ? 'main' : 'gem'}:${rowId}`;
}

async function extractRows(
  page: import('playwright').Page,
  market: 'hk-main' | 'hk-gem',
  statusTab: 'ACTIVE' | 'INACTIVE'
): Promise<HkexRow[]> {
  // 切到对应状态 tab（如果不在默认页）
  if (statusTab !== 'ACTIVE') {
    const tab = page.locator('a.tab.nav-link', { hasText: statusTab }).first();
    if (await tab.isVisible().catch(() => false)) {
      await tab.click();
      await page.waitForTimeout(2500);
    }
  }

  const status: ReviewStatus = statusTab === 'ACTIVE' ? 'accepted' : 'suspended';

  return page.$$eval('table tbody tr', (trs, args) => {
    const market = args.market as 'hk-main' | 'hk-gem';
    const status = args.status as ReviewStatus;
    return trs.map((tr) => {
      const dateEl = tr.querySelector('.col-posting-date .mobile-list-body');
      const nameEl = tr.querySelector('.applicant-name');
      const idAttr = tr.querySelector('.col-applicants')?.getAttribute('id') || '';

      // INACTIVE 行可能没有 .col-posting-date， fallback 到最新 document date
      let dateText = dateEl?.textContent?.trim() || '';
      const docRecords = Array.from(tr.querySelectorAll('.application-record'));
      const docs: { type: string; url: string; date: string }[] = [];
      docRecords.forEach((rec) => {
        const d = rec.querySelector('.application-record-date')?.textContent?.trim() || '';
        const t = rec.querySelector('.doc-type')?.textContent?.trim() || '';
        const link = rec.querySelector('a');
        const href = link?.getAttribute('href') || '';
        if (d) {
          docs.push({ type: t, url: href, date: d });
        }
      });
      if (!dateText && docs.length > 0) {
        // 取最新 document date 作为 posting date
        const sorted = [...docs].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        dateText = sorted[0].date;
      }

      return {
        date: dateText,
        name: nameEl?.textContent?.trim() || '',
        id: idAttr,
        market,
        status,
        documents: docs,
      };
    }).filter((r) => r.name && r.date);
  }, { market, status });
}

export async function fetchHkex(): Promise<{
  companies: Company[];
  errors: { source: string; message: string }[];
}> {
  const errors: { source: string; message: string }[] = [];

  const launchOptions: import('playwright').LaunchOptions = {
    headless: true,
  };
  if (CHROME_PATH) {
    launchOptions.executablePath = CHROME_PATH;
  }

  let browser: import('playwright').Browser | undefined;
  try {
    browser = await chromium.launch(launchOptions);
  } catch (err) {
    errors.push({
      source: 'hkex',
      message: `Playwright launch failed: ${err instanceof Error ? err.message : String(err)}`,
    });
    return { companies: [], errors };
  }

  const allRows: HkexRow[] = [];
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/appindex.html`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.waitForTimeout(3000);

    // 主板 ACTIVE（默认就是主板）
    console.log('▸ 抓取 HKEx 主板 Application Proofs ...');
    const mainActive = await extractRows(page, 'hk-main', 'ACTIVE');
    console.log(`  ✔ 主板 ACTIVE ${mainActive.length} 条`);
    allRows.push(...mainActive);

    // 主板 INACTIVE
    try {
      const mainInactive = await extractRows(page, 'hk-main', 'INACTIVE');
      console.log(`  ✔ 主板 INACTIVE ${mainInactive.length} 条`);
      allRows.push(...mainInactive);
    } catch (e) {
      console.warn(`  ⚠ 主板 INACTIVE tab failed:`, (e as Error).message);
    }

    // 切到 GEM tab
    const gemTab = page.locator('a.boardTab.gem');
    if (await gemTab.isVisible().catch(() => false)) {
      await gemTab.click();
      await page.waitForTimeout(3000);

      // GEM ACTIVE
      console.log('▸ 抓取 HKEx GEM Application Proofs ...');
      const gemActive = await extractRows(page, 'hk-gem', 'ACTIVE');
      console.log(`  ✔ GEM ACTIVE ${gemActive.length} 条`);
      allRows.push(...gemActive);

      // GEM INACTIVE
      try {
        const gemInactive = await extractRows(page, 'hk-gem', 'INACTIVE');
        console.log(`  ✔ GEM INACTIVE ${gemInactive.length} 条`);
        allRows.push(...gemInactive);
      } catch (e) {
        console.warn(`  ⚠ GEM INACTIVE tab failed:`, (e as Error).message);
      }
    } else {
      console.warn('  ⚠ GEM tab not found');
    }
  } catch (err) {
    errors.push({
      source: 'hkex',
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    await page.close();
    await browser.close();
  }

  const companies: Company[] = allRows.map((r) => {
    const appProofDoc = r.documents.find((d) =>
      d.type.toLowerCase().includes('application proof')
    );
    const phipDoc = r.documents.find((d) => d.type.toLowerCase().includes('phip'));

    // 状态细化：如果有 PHIP 则更接近上市
    let status = r.status;
    if (status === 'accepted' && phipDoc) {
      status = 'submitted'; // 已提交 PHIP，接近注册/上市
    }

    // rawUrl 优先用 Multi-Files 页，fallback 到 Application Proof PDF
    const multiFilesDoc = r.documents.find((d) =>
      d.type.toLowerCase().includes('multi-files')
    );
    const rawUrl = multiFilesDoc
      ? `${BASE_URL}/${multiFilesDoc.url}`
      : appProofDoc
        ? `${BASE_URL}/${appProofDoc.url}`
        : `${BASE_URL}/appindex.html`;

    return {
      id: buildId(r.market, r.id),
      name: stripSuffix(r.name),
      nameEn: r.name,
      market: r.market,
      status,
      updateDate: parseDate(r.date),
      acceptDate: parseDate(appProofDoc?.date || r.date),
      source: 'hkex',
      rawUrl,
    };
  });

  // 去重（按 id）
  const seen = new Set<string>();
  const deduped = companies.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  return { companies: deduped, errors };
}
