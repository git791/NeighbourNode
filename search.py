import urllib.request, re
url = 'https://html.duckduckgo.com/html/?q=AWS%3A%3AEarlyValidation%3A%3AResourceExistenceCheck'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    snippets = re.findall(r'<a class="result__snippet[^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
    for i, s in enumerate(snippets[:3]): print(f"{i+1}. {re.sub(r'<[^>]+>', '', s).strip()}")
except Exception as e:
    print(e)
