import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('http://localhost:3000/api/reports?courseId=clz8j1gxx000108l62h9v2x4a'); // Need a valid courseId
    console.log(res.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
main();
