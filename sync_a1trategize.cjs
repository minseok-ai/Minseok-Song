const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Projects\\A1trategize\\static';
const destDir = path.join(__dirname, 'public', 'a1trategize-mock');

// Vercel 등 외부 환경이거나 경로가 없을 경우 무시 (로컬 환경에서만 복사되도록 함)
if (!fs.existsSync(sourceDir)) {
  console.log(`[Sync] Source directory ${sourceDir} not found. Skipping A1trategize mock sync.`);
  process.exit(0);
}

// 목적지 폴더가 없으면 생성
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// 소스 디렉토리 안의 파일들 읽기
const files = fs.readdirSync(sourceDir);

files.forEach(file => {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(destDir, file);

  // 디렉토리는 제외하고 파일만 복사 (static 폴더 구조상 단일 depth로 가정)
  if (fs.statSync(sourceFile).isFile()) {
    let content = fs.readFileSync(sourceFile);

    // index.html 또는 js, css 파일인 경우 정적 경로 패치
    if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
      let textContent = content.toString('utf8');
      
      // HTML/JS/CSS 내의 절대 경로 "/static/..."를 "/a1trategize-mock/..."로 교체
      textContent = textContent.replace(/\/static\//g, '/a1trategize-mock/');
      
      if (file === 'app.js') {
        // 백엔드 API 연동 없이 UI를 모의(Mock) 구동하기 위해 API 에러 시 하드코딩된 모드를 불러오도록 주입
        textContent = textContent.replace(
          /catch\s*\(e\)\s*\{\s*console\.error\("Failed to load domains:",\s*e\);\s*\}/g,
          `catch (e) {
      domainRegistry = [
        { key: "business", label: "Business Strategy", icon_id: "mode-business", description: "Strategic planning, market analysis, and growth strategies." },
        { key: "career", label: "Career & Interview", icon_id: "mode-career", description: "Resume review, career path coaching, and interview prep." },
        { key: "ip", label: "IP & Patent", icon_id: "mode-ip", description: "Patent drafting, prior art search, and IP strategy." },
        { key: "nnfc", label: "NNFC Recipe", icon_id: "mode-nnfc", description: "NNFC semiconductor process recipe validation against 183 tools." }
      ];
      renderDomainControls(domainRegistry);
    }`
        );
      }
      
      fs.writeFileSync(destFile, textContent, 'utf8');
      console.log(`[Sync] Copied and patched: ${file}`);
    } else {
      // 이미지나 바이너리 파일은 그대로 복사
      fs.writeFileSync(destFile, content);
      console.log(`[Sync] Copied: ${file}`);
    }
  }
});

console.log('[Sync] A1trategize mock UI has been synced successfully.');
