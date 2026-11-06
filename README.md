
# Zengyuan Zuo's Homepage

Personal academic homepage: <https://harbinzzy.github.io/>.

- `index.html`: biography and academic advisor, profile contact details, news, selected publications (including MARS), research experience, and professional activities.
- `assets/homepage.css`: responsive academic homepage styles, inspired by [Shuai Tan's homepage](https://tanshuai0219.github.io/).
- `assets/home/`: author portrait from [arXiv:2410.15067v2](https://arxiv.org/html/2410.15067v2), survey taxonomy (Fig. 1) from the latest [arXiv:2410.15067v3](https://arxiv.org/html/2410.15067v3) (revised August 12, 2025; checked October 11, 2026), and the UDPNet figure from the author's public research repository.
- `assets/home/pku.png`: Peking University seal from the university's [official identification system](https://www.pku.edu.cn/detail/1096.html).
- `projects/mars.html` and `assets/site.css`: existing MARS project page and its independent styles.
- `projects/aioir/index.html`: the survey project page, combining a Library section (year / venue / author search and code filtering) and a Leaderboard section (five benchmark families, independent real-world tracks, sorting, method details, CSV export and responsive tables). `leaderboard.html` redirects older links to this single page. Data is read from the Survey repository's public `data/catalog.json`, with `projects/aioir/catalog.js` as an offline fallback.

The homepage is static HTML/CSS and is published by the repository's existing GitHub Pages deployment. No build step is required.

Keep degree dates, honors, service, and publication status tied to confirmed information. Update the footer date when updating the homepage.
