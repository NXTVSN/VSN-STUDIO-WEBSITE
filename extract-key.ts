import fs from 'fs';
const content = fs.readFileSync('dist/assets/index-BqKS0LKh.js', 'utf-8');
const match = content.match(/AIzaSy[0-9a-zA-Z_-]{33}/);
if (match) {
  console.log("FOUND KEY:", match[0]);
} else {
  console.log("KEY NOT FOUND");
}
