import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });

async function screenshot(page, name) {
  await page.screenshot({ path: `/tmp/${name}.png`, fullPage: true });
  console.log(`SCREENSHOT: ${name}`);
}

const page = await browser.newPage();
const errors = [];
page.on('pageerror', err => errors.push(err.message));
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text());
});

try {
  // localStorage에 TEACHER 토큰 주입 후 강사 대시보드 접근
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'mock-teacher-token');
    localStorage.setItem('refreshToken', 'mock-refresh-token');
    // AuthContext가 읽는 user 상태를 흉내냄 (토큰이 유효하지 않아 API 실패해도 페이지는 뜸)
  });

  // 강사 대시보드 직접 방문 (보호된 라우트지만 토큰은 있으니 렌더링 됨)
  await page.goto(`${BASE}/teacher`);
  await page.waitForTimeout(2000);
  const teacherUrl = page.url();
  console.log(`Teacher URL: ${teacherUrl}`);

  if (teacherUrl.includes('/teacher')) {
    await screenshot(page, 'teacher_dashboard');
    // 통계 섹션 확인
    const statsPanel = await page.$('h2:has-text("내 강의 통계")');
    if (statsPanel) console.log('✅ 강사 대시보드 - 내 강의 통계 섹션 존재');
    else console.log('❌ 강사 대시보드 - 내 강의 통계 섹션 없음');

    const chapterPanel = await page.$('h2:has-text("강의 챕터 관리")');
    if (chapterPanel) console.log('✅ 강사 대시보드 - 챕터 관리 섹션 존재');

    const lectureCreatePanel = await page.$('h2:has-text("강의 생성")');
    if (lectureCreatePanel) console.log('✅ 강사 대시보드 - 강의 생성 섹션 존재');
  } else {
    console.log('⚠️  Teacher dashboard redirected to:', teacherUrl);
  }

  // 관리자 대시보드
  await page.goto(`${BASE}/admin`);
  await page.waitForTimeout(2000);
  const adminUrl = page.url();
  console.log(`Admin URL: ${adminUrl}`);

  if (adminUrl.includes('/admin')) {
    await screenshot(page, 'admin_dashboard');
    const certPanel = await page.$('h2:has-text("자격증 등록")');
    if (certPanel) console.log('✅ 관리자 대시보드 - 자격증 관리 섹션 존재');

    const lecturePanel = await page.$('h2:has-text("강의 관리")');
    if (lecturePanel) console.log('✅ 관리자 대시보드 - 강의 관리 섹션 존재');
    else console.log('❌ 관리자 대시보드 - 강의 관리 섹션 없음');
  } else {
    console.log('⚠️  Admin dashboard redirected to:', adminUrl);
  }

  // 강의 상세 페이지 (id=1 가정, API 없어도 렌더링 확인)
  await page.goto(`${BASE}/lectures/1`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'lecture_detail');

  // 리뷰 탭 클릭 시도
  const reviewTab = await page.$('button:has-text("수강 후기")');
  if (reviewTab) {
    await reviewTab.click();
    await page.waitForTimeout(800);
    await screenshot(page, 'lecture_reviews');
    console.log('✅ 강의 상세 - 리뷰 탭 클릭 가능');
  }

  if (errors.length > 0) {
    console.log('\n⚠️  발견된 에러:');
    errors.forEach(e => console.log(' ', e));
  } else {
    console.log('\n✅ JS/React 런타임 에러 없음');
  }

} finally {
  await browser.close();
  // 테스트 파일 정리
  import('fs').then(fs => {
    try { fs.unlinkSync('test_auth_pages.mjs'); } catch {}
    try { fs.unlinkSync('test_features.mjs'); } catch {}
  });
}
