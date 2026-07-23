[README.md](https://github.com/user-attachments/files/30288123/README.md)
# 냉장고 파먹기

냉장고에 있는 재료를 입력하면 만들 수 있는 요리 레시피를 추천해주는 웹 앱입니다.

## 실행 방법
정적 HTML/CSS/JS로만 구성되어 있어 별도 빌드 없이 바로 배포할 수 있습니다.

## Vercel 배포
1. GitHub 저장소에 이 폴더 내용을 push 합니다.
2. https://vercel.com 에서 New Project → 해당 저장소 선택
3. Framework Preset을 "Other"로 두고 Build Command는 비워둡니다 (정적 파일이라 빌드 불필요).
4. Deploy 클릭하면 끝!

## 로컬 확인
`index.html`을 브라우저로 바로 열거나, `npx serve .` 명령으로 확인할 수 있습니다.

## 파일 구성
- `index.html` : 메인 페이지 구조
- `style.css` : 스타일
- `script.js` : 재료 매칭 로직 및 UI 동작
- `recipes.js` : 레시피 데이터 (여기에 레시피 추가/수정)
- `vercel.json` : Vercel 배포 설정
