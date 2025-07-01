document.addEventListener('DOMContentLoaded', () => {
	// *** Элементы DOM ***
	const progressFill = document.getElementById('progress-fill')
	const shoes = document.getElementById('shoes')
	const handHint = document.querySelector('.hand-hint')
	const endScreen = document.querySelector('.end-screen')
	const ctaButton = document.getElementById('cta-button')
	const canvas = document.getElementById('clean-layer')
	const ctx = canvas.getContext('2d')
	const maskImage = document.getElementById('mask-image')

	// *** Аудиофайлы ***
	const cleanSound = new Audio('assets/clean.mp3')
	const clickSound = new Audio('assets/click.mp3')

	// *** Переменные состояния ***
	let progress = 0
	const maxProgress = 100
	let lastTouch = null
	const moveThreshold = 10
	let ended = false

	// *** Общие функции ***
	function applyAlphaMask() {
		if (!maskImage.complete) return

		const tmp = document.createElement('canvas')
		tmp.width = canvas.width
		tmp.height = canvas.height

		const tmpCtx = tmp.getContext('2d')
		tmpCtx.drawImage(maskImage, 0, 0, canvas.width, canvas.height)

		const maskImageData = tmpCtx.getImageData(
			0,
			0,
			canvas.width,
			canvas.height
		).data
		const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
		const data = canvasImageData.data

		for (let i = 0; i < maskImageData.length; i += 4) {
			if (maskImageData[i + 3] < 10) data[i + 3] = 0
		}
		ctx.putImageData(canvasImageData, 0, 0)
	}

	function resizeCanvas() {
		if (ended) return

		const shoeRect = shoes.getBoundingClientRect()
		const containerRect = document
			.querySelector('.game-container')
			.getBoundingClientRect()

		canvas.width = shoeRect.width
		canvas.height = shoeRect.height

		canvas.style.left = `${shoeRect.left - containerRect.left}px`
		canvas.style.top = `${shoeRect.top - containerRect.top}px`
		canvas.style.width = `${shoeRect.width}px`
		canvas.style.height = `${shoeRect.height}px`

		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.fillStyle = 'rgba(180,180,180,0.6)'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		applyAlphaMask()
	}

	window.addEventListener('resize', resizeCanvas)
	resizeCanvas()

	function eraseAt(x, y) {
		const rect = canvas.getBoundingClientRect()
		const localX = x - rect.left
		const localY = y - rect.top

		ctx.globalCompositeOperation = 'destination-out'
		ctx.beginPath()
		ctx.arc(localX, localY, 20, 0, Math.PI * 2)
		ctx.fill()
		ctx.globalCompositeOperation = 'source-over'
	}

	function hideHint() {
		handHint.style.display = 'none'
	}

	function cleanStep() {
		if (ended) return

		progress = Math.min(maxProgress, progress + 0.3)
		progressFill.style.width = `${progress}%`

		if (progress >= maxProgress) {
			ended = true

			shoes.style.display = 'none'
			canvas.style.display = 'none'
			handHint.style.display = 'none'
			document.querySelector('.progress-bar').style.display = 'none'

			endScreen.classList.remove('hidden')
		}
	}

	function playAudio(audioEl) {
		try {
			audioEl.play()
		} catch (err) {
			console.error('Ошибка воспроизведения звука:', err)
		}
	}

	function handleMove(x, y) {
		eraseAt(x, y)
		playAudio(cleanSound)
		cleanStep()
	}

	function setupEventListeners() {
		canvas.addEventListener(
			'touchstart',
			e => {
				e.preventDefault()
				lastTouch = e.touches[0]
				hideHint()
			},
			{ passive: false }
		)

		canvas.addEventListener(
			'touchmove',
			e => {
				e.preventDefault()
				if (!lastTouch) return

				const touch = e.touches[0]
				const dx = touch.clientX - lastTouch.clientX
				const dy = touch.clientY - lastTouch.clientY

				if (Math.hypot(dx, dy) > moveThreshold) {
					handleMove(touch.clientX, touch.clientY)
					lastTouch = touch
				}
			},
			{ passive: false }
		)

		canvas.addEventListener('touchend', () => (lastTouch = null))

		canvas.addEventListener('mousedown', e => {
			hideHint()
			handleMove(e.clientX, e.clientY)

			const moveHandler = event => handleMove(event.clientX, event.clientY)

			document.addEventListener('mousemove', moveHandler)
			document.addEventListener(
				'mouseup',
				() => {
					document.removeEventListener('mousemove', moveHandler)
				},
				{ once: true }
			)
		})

		ctaButton.addEventListener('click', () => {
			playAudio(clickSound)
			window.open('https://auth-dashboard-site.vercel.app/', '_blank')
		})
	}

	setupEventListeners()
})
