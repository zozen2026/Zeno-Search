export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'كلمة البحث مطلوبة.' });
    }

    try {
        // جلب النتائج عبر واجهة بحث آمنة وسريعة
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

        const response = await fetch(searchUrl);
        const data = await response.json();

        let results = [];

        // إذا وُجدت إجابة مباشرة
        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                snippet: data.AbstractText,
                url: data.AbstractURL || '#'
            });
        }

        // جلب المواضيع والنتائج المرتبطة
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.forEach(item => {
                if (item.Text && item.FirstURL) {
                    results.push({
                        title: item.Text.split(' - ')[0] || 'نتيجة بحث Zeno',
                        snippet: item.Text,
                        url: item.FirstURL
                    });
                }
            });
        }

        // نتيجة افتراضية توجيهية في حال لم تكن النتائج كافية
        if (results.length === 0) {
            results.push({
                title: `نتائج Zeno Search لـ: ${query}`,
                snippet: `تم العثور على مصادر ويب ومحتوى متعلق بـ "${query}" عبر شبكة Zeno الذكية. اضغط للاستعراض.`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
            });
        }

        return res.status(200).json({ results });

    } catch (error) {
        return res.status(500).json({ 
            error: 'حدث خطأ أثناء جلب النتائج: ' + error.message 
        });
    }
}