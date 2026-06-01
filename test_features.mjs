import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE_ERROR:', msg.text()); });

async function screenshot(name) {
  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: false });
  console.log(`SCREENSHOT: ${name}`);
}

async function waitAndScreenshot(name, ms = 1500) {
  await page.waitForTimeout(ms);
  await screenshot(name);
}

try {
  // 1. 홈 화면
  await page.goto(BASE);
  await waitAndScreenshot('01_home');
  console.log('✅ 홈 화면 로드');

  // 2. 로그인 페이지 접근
  await page.goto(`${BASE}/login`);
  await waitAndScreenshot('02_login');
  console.log('✅ 로그인 페이지 로드');

  // 3. 강사 대시보드 접근 (미로그인 → 리다이렉트 or 403)
  await page.goto(`${BASE}/teacher`);
  await waitAndScreenshot('03_teacher_dashboard');
  const teacherUrl = page.url();
  console.log(`강사 대시보드 URL: ${teacherUrl}`);

  // 4. 관리자 대시보드 접근
  await page.goto(`${BASE}/admin`);
  await waitAndScreenshot('04_admin_dashboard');
  const adminUrl = page.url();
  console.log(`관리자 대시보드 URL: ${adminUrl}`);

  // 5. 강의 목록 페이지
  await page.goto(`${BASE}/lectures`);
  await waitAndScreenshot('05_lectures');
  console.log('✅ 강의 목록 페이지 로드');

  // 6. 첫 번째 강의 클릭해서 리뷰 섹션 확인
  const lectureLinks = await page.$$('a[href^="/lectures/"]');
  if (lectureLinks.length > 0) {
    await lectureLinks[0].click();
    await waitAndScreenshot('06_lecture_detail', 2000);
    // 리뷰 탭 클릭
    const reviewTab = await page.$('button:has-text("수강 후기")');
    if (reviewTab) {
      await reviewTab.click();
      await waitAndScreenshot('07_reviews_tab', 1000);
      console.log('✅ 리뷰 탭 클릭');
    }
  }

  // JS/React 에러 체크
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  if (errors.length > 0) {
    console.log('PAGE_ERRORS:', errors);
  } else {
    console.log('✅ 페이지 JS 에러 없음');
  }

} catch(e) {
  console.error('TEST_ERROR:', e.message);
} finally {
  await browser.close();
}
