// The downloads of the IDE page (docs/ide/index.md): the GitHub releases ide-v<version> of lambda-orm/data-gateway, read
// by the browser (no file of them is in this wiki). The OS of the visitor is detected to recommend its download; every
// version is listed with its files for Linux, Windows and macOS. The texts come from the page (its language), in
// data-labels. Without JavaScript, or if GitHub doesn't answer, the page still links to the releases.
(function () {
	'use strict'
	var root = document.getElementById('ide-downloads')
	if (!root) return
	var repo = root.getAttribute('data-repo') || 'lambda-orm/data-gateway'
	var prefix = root.getAttribute('data-tag-prefix') || 'ide-v'
	var labels = {}
	try { labels = JSON.parse(root.getAttribute('data-labels') || '{}') } catch (e) { labels = {} }
	var t = function (key, values) {
		var text = labels[key] || key
		Object.keys(values || {}).forEach(function (k) { text = text.split('{' + k + '}').join(values[k]) })
		return text
	}
	var releasesUrl = 'https://github.com/' + repo + '/releases?q=' + encodeURIComponent(prefix) + '&expanded=true'
	var latestUrl = 'https://github.com/' + repo + '/releases/latest'
	var CACHE = 'ide-downloads-v1:' + repo
	var TEN_MINUTES = 10 * 60 * 1000

	var escape = function (text) {
		return String(text).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] })
	}

	// the notes of a release (Markdown written in GitHub): everything escaped, then only headings, lists, bold, code
	// and https links built; nothing of the release runs as HTML
	var inline = function (text) {
		return escape(text)
			.replace(/`([^`]+)`/g, '<code>$1</code>')
			.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
			.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
	}
	var markdown = function (text) {
		var html = []
		var list = false
		String(text || '').replace(/\r/g, '').split('\n').forEach(function (line) {
			var item = /^\s*[-*]\s+(.*)$/.exec(line)
			var heading = /^(#{1,6})\s+(.*)$/.exec(line)
			if (item) {
				if (!list) { html.push('<ul>'); list = true }
				html.push('<li>' + inline(item[1]) + '</li>')
				return
			}
			if (list) { html.push('</ul>'); list = false }
			if (heading) html.push('<p><strong>' + inline(heading[2]) + '</strong></p>')
			else if (line.trim() === '---') html.push('<hr>')
			else if (line.trim()) html.push('<p>' + inline(line) + '</p>')
		})
		if (list) html.push('</ul>')
		return html.join('')
	}

	// the files of a release by platform and architecture, from their names (and their extension, else)
	var SKIP = /\.blockmap$|latest[^/]*\.yml$|\.7z$/i
	var platformOf = function (name) {
		if (/\.dmg$|\.pkg$|-mac[^/]*\.zip$/i.test(name)) return 'mac'
		if (/\.exe$|\.msi$|-win[^/]*\.zip$/i.test(name)) return 'win'
		if (/\.AppImage$|\.deb$|\.rpm$|\.tar\.gz$/i.test(name)) return 'linux'
		return undefined
	}
	var archOf = function (name, platform) {
		if (/arm64|aarch64/i.test(name)) return 'arm64'
		if (/x64|x86_64|amd64|intel/i.test(name)) return 'x64'
		if (platform === 'win' && /-win\.(exe|msi)$/i.test(name)) return 'both'
		return 'x64'
	}
	var formatOf = function (name) {
		var m = /\.(AppImage|deb|rpm|tar\.gz|exe|msi|dmg|pkg|zip)$/i.exec(name)
		return m ? m[1] : name
	}
	var filesOf = function (release) {
		var files = { linux: [], win: [], mac: [] }
		;(release.assets || []).forEach(function (asset) {
			if (SKIP.test(asset.name)) return
			var platform = platformOf(asset.name)
			if (!platform) return
			files[platform].push({ name: asset.name, url: asset.browser_download_url, size: asset.size, arch: archOf(asset.name, platform), format: formatOf(asset.name) })
		})
		return files
	}

	var archLabel = function (platform, arch) {
		if (arch === 'both') return t('bothArchs')
		if (platform === 'mac') return arch === 'arm64' ? t('appleSilicon') : t('intel')
		return arch
	}
	var mb = function (bytes) { return (bytes / 1048576).toFixed(1) + ' MB' }
	var dateOf = function (iso) {
		try { return new Intl.DateTimeFormat(document.documentElement.lang || 'en', { dateStyle: 'medium' }).format(new Date(iso)) } catch (e) { return iso.slice(0, 10) }
	}

	// the OS of the visitor, and its architecture when the browser says it (Safari doesn't: on a Mac, both)
	var detect = function () {
		var ua = navigator.userAgent || ''
		var platform = (navigator.userAgentData && navigator.userAgentData.platform) || ua
		var os = /win/i.test(platform) ? 'win' : /mac|iphone|ipad/i.test(platform) ? 'mac' : /linux|x11|cros/i.test(platform) ? 'linux' : undefined
		var arch = /arm64|aarch64/i.test(ua) ? 'arm64' : undefined
		if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
			return navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness']).then(function (v) {
				return { os: os, arch: v.architecture === 'arm' ? 'arm64' : v.architecture === 'x86' ? 'x64' : arch }
			}, function () { return { os: os, arch: arch } })
		}
		return Promise.resolve({ os: os, arch: arch })
	}

	// the releases of the IDE: up to three pages of the repository (its other releases are left out); 10 minutes in this tab
	var read = function () {
		try {
			var kept = JSON.parse(sessionStorage.getItem(CACHE) || 'null')
			if (kept && Date.now() - kept.at < TEN_MINUTES) return Promise.resolve(kept.releases)
		} catch (e) { /* no storage */ }
		var all = []
		var page = function (n) {
			return fetch('https://api.github.com/repos/' + repo + '/releases?per_page=100&page=' + n, { headers: { Accept: 'application/vnd.github+json' } }).then(function (response) {
				if (!response.ok) {
					var error = new Error('GitHub ' + response.status)
					error.status = response.status
					error.reset = response.headers.get('x-ratelimit-reset')
					error.remaining = response.headers.get('x-ratelimit-remaining')
					throw error
				}
				var next = /rel="next"/.test(response.headers.get('link') || '')
				return response.json().then(function (releases) {
					releases.forEach(function (r) { if (!r.draft && typeof r.tag_name === 'string' && r.tag_name.indexOf(prefix) === 0) all.push(r) })
					if (!all.length && next && n < 3) return page(n + 1)
					return all
				})
			})
		}
		return page(1).then(function (releases) {
			var slim = releases.map(function (r) {
				return { tag: r.tag_name, version: r.tag_name.slice(prefix.length), date: r.published_at, url: r.html_url, prerelease: r.prerelease, notes: r.body || '',
					assets: (r.assets || []).map(function (a) { return { name: a.name, browser_download_url: a.browser_download_url, size: a.size } }) }
			})
			try { sessionStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), releases: slim })) } catch (e) { /* no storage */ }
			return slim
		})
	}

	var link = function (file, text, primary) {
		return '<a class="' + (primary ? 'ide-dl-button' : 'ide-dl-file') + '" href="' + escape(file.url) + '" title="' + escape(file.name + ' · ' + mb(file.size)) + '">' + text + '</a>'
	}

	// the recommended file(s) of a platform: the AppImage, the installer of its architecture, the dmg
	var recommended = function (files, os, arch) {
		var list = files[os] || []
		var pick = function (format, archs) {
			for (var i = 0; i < archs.length; i++) {
				var found = list.filter(function (f) { return f.format.toLowerCase() === format && f.arch === archs[i] })[0]
				if (found) return found
			}
			return undefined
		}
		if (os === 'mac') return arch ? [pick('dmg', [arch])].filter(Boolean) : [pick('dmg', ['arm64']), pick('dmg', ['x64'])].filter(Boolean)
		if (os === 'win') return [arch ? pick('exe', [arch, 'both']) : pick('exe', ['both', 'x64'])].filter(Boolean)
		return [pick('appimage', [arch || 'x64', 'x64'])].filter(Boolean)
	}

	var platforms = [['linux', 'linux'], ['win', 'windows'], ['mac', 'macos']]

	var renderFiles = function (files) {
		return '<div class="ide-dl-platforms">' + platforms.map(function (p) {
			var list = files[p[0]]
			return '<section class="ide-dl-platform"><h4>' + escape(t(p[1])) + '</h4>' + (list.length
				? '<ul>' + list.map(function (f) {
					return '<li>' + link(f, escape(f.format) + ' · ' + escape(archLabel(p[0], f.arch))) + ' <span class="ide-dl-size">' + mb(f.size) + '</span></li>'
				}).join('') + '</ul>'
				: '<p class="ide-dl-muted">—</p>') + '</section>'
		}).join('') + '</div>'
	}

	var renderVersions = function (releases) {
		var cell = function (files, platform) {
			var list = files[platform]
			if (!list.length) return '—'
			return list.map(function (f) { return link(f, escape(f.format) + ' ' + escape(archLabel(platform, f.arch))) }).join(' ')
		}
		return '<div class="ide-dl-table"><table><thead><tr><th>' + escape(t('version')) + '</th><th>' + escape(t('date')) + '</th>' +
			platforms.map(function (p) { return '<th>' + escape(t(p[1])) + '</th>' }).join('') + '</tr></thead><tbody>' +
			releases.map(function (r) {
				var files = filesOf({ assets: r.assets })
				return '<tr><td><a href="' + escape(r.url) + '" rel="noopener noreferrer">' + escape(r.version) + '</a>' +
					(r.notes ? '<details><summary>' + escape(t('notes')) + '</summary><div class="ide-dl-notes">' + markdown(r.notes) + '</div></details>' : '') + '</td>' +
					'<td>' + escape(dateOf(r.date)) + '</td><td>' + cell(files, 'linux') + '</td><td>' + cell(files, 'win') + '</td><td>' + cell(files, 'mac') + '</td></tr>'
			}).join('') + '</tbody></table></div>'
	}

	var render = function (releases, visitor) {
		var stable = releases.filter(function (r) { return !r.prerelease })
		var tests = releases.filter(function (r) { return r.prerelease })
		if (!stable.length && !tests.length) {
			root.innerHTML = '<p>' + escape(t('noReleases')) + '</p><p><a class="ide-dl-button" href="' + escape(releasesUrl) + '" rel="noopener noreferrer">' + escape(t('openReleases')) + '</a></p>'
			return
		}
		var latest = stable[0] || tests[0]
		var files = filesOf({ assets: latest.assets })
		var html = []
		var picks = visitor.os ? recommended(files, visitor.os, visitor.arch) : []
		html.push('<div class="ide-dl-latest"><p class="ide-dl-version">' + escape(t('latest', { version: latest.version, date: dateOf(latest.date) })) + '</p>')
		if (picks.length) {
			var osName = t(visitor.os === 'win' ? 'windows' : visitor.os === 'mac' ? 'macos' : 'linux')
			html.push('<p class="ide-dl-primary">' + picks.map(function (f) {
				return link(f, escape(t('downloadFor', { os: osName })) + (picks.length > 1 || visitor.os === 'mac' ? ' · ' + escape(archLabel(visitor.os, f.arch)) : ''), true)
			}).join(' ') + '</p>')
		}
		html.push('</div>')
		html.push(renderFiles(files))
		if (latest.notes) html.push('<details class="ide-dl-latest-notes"><summary>' + escape(t('notes')) + '</summary><div class="ide-dl-notes">' + markdown(latest.notes) + '</div></details>')
		if (stable.length) html.push('<h3>' + escape(t('allVersions')) + '</h3>' + renderVersions(stable))
		if (tests.length) html.push('<details class="ide-dl-tests"><summary>' + escape(t('testVersions')) + '</summary>' + renderVersions(tests) + '</details>')
		html.push('<p><a href="' + escape(releasesUrl) + '" rel="noopener noreferrer">' + escape(t('openReleases')) + '</a></p>')
		root.innerHTML = html.join('')
	}

	var renderError = function (error) {
		var limited = (error.status === 403 || error.status === 429) && error.remaining === '0'
		var message = limited && error.reset
			? t('rateLimit', { time: new Date(Number(error.reset) * 1000).toLocaleTimeString(document.documentElement.lang || undefined, { hour: '2-digit', minute: '2-digit' }) })
			: t('error')
		root.innerHTML = '<p class="ide-dl-problem">' + escape(message) + '</p><p><a class="ide-dl-button" href="' + escape(latestUrl) + '" rel="noopener noreferrer">' + escape(t('openReleases')) + '</a></p>'
	}

	root.setAttribute('aria-busy', 'true')
	root.innerHTML = '<p class="ide-dl-muted">' + escape(t('loading')) + '</p>'
	Promise.all([read(), detect()]).then(function (results) { render(results[0], results[1]) }, renderError)
		.then(function () { root.removeAttribute('aria-busy') })
})()
