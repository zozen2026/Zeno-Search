export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'كلمة البحث مطلوبة.' });
    }

    try {
        // رابط بحث مباشر وسريع باستخدام واجهة DuckDuckGo البرمجية
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

        const response = await fetch(searchUrl);
        const data = await response.json();

        let results = [];

        // التحقق من وجود إجابة مباشرة
        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                snippet: data.AbstractText,
                url: data.AbstractURL || '#'
            });
        }

        // التحقق من وجود نتائج مرتبطة إضافية
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.forEach(item => {
                if (item.Text && item.FirstURL) {
                    results.push({
                        title: item.Text.split(' - ')[0] || 'نتيجة بحث',
                        snippet: item.Text,
                        url: item.FirstURL
                    });
                }
            });
        }

        // إذا لم توجد نتائج جاهزة، يتم إرجاع رابط توجيهي مباشر للبحث
        if (results.length === 0) {
            results.push({
                title: `نتائج البحث عن: ${query}`,
                snippet: `انقر لاستعراض نتائج الويب المرتبطة بـ ${query} مباشرة على المنصة.`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
            });
        }

        return res.status(200).json({ results });

    } catch (error) {
        return res.status(500).json({ 
            error: 'حدث خطأ أثناء الاتصال بخادم البحث: ' + error.message 
        });
    }
}