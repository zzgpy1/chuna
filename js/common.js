// Supabase 配置（务必替换为你的项目值）
const SUPABASE_URL = 'https://nosdotnkovyqiiulitck.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2RvdG5rb3Z5cWlpdWxpdGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODQ3MzAsImV4cCI6MjA5NTI2MDczMH0.UCMqR0-XjeGbq7EoTBRxG2FW1ujc_L0xpZmrs-cgxgg'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 音乐播放器控制（公共）
document.addEventListener('DOMContentLoaded', () => {
    const musicToggle = document.getElementById('musicToggle');
    const bgAudio = document.getElementById('bgAudio');
    if (musicToggle && bgAudio) {
        let playing = false;
        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!playing) {
                bgAudio.play().catch(e => console.log("自动播放被阻止，需用户交互"));
                musicToggle.innerHTML = '<i class="fas fa-pause"></i>';
                playing = true;
            } else {
                bgAudio.pause();
                musicToggle.innerHTML = '<i class="fas fa-play"></i>';
                playing = false;
            }
        });
    }
});

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
}

// 渲染 Markdown + 代码高亮
async function renderMarkdown(md) {
    if (!md) return '';
    let html = marked.parse(md);
    setTimeout(() => {
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }, 0);
    return html;
}
