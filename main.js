const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let flowerStarted = false;

// UI Elements
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const question = document.getElementById('question');

// Resize Handler
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Flower Logic (Beautiful Rose Style) ---

class Petal {
    constructor(angle, distance, length, width, color) {
        this.angle = angle;
        this.distance = distance; // Distance from center
        this.length = length;
        this.width = width;
        this.color = color;
        this.growth = 0;
        this.bloomDelay = distance * 0.1; // Outer petals bloom later
        
        // Random variance for natural look
        this.curl = (Math.random() - 0.5) * 0.5;
    }

    update(time) {
        if (time > this.bloomDelay) {
            this.growth = Math.min(1, (time - this.bloomDelay) * 0.5);
        }
    }

    draw(ctx, centerX, centerY) {
        if (this.growth <= 0) return;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        
        // Petal Shape using Bezier Curves
        // Start at (0, -distance) which is the attachment point
        ctx.moveTo(0, -this.distance * this.growth);
        
        // Control points for variable width and curl
        const l = this.length * this.growth;
        const w = this.width * this.growth;
        
        // Left curve
        ctx.bezierCurveTo(
            -w / 2, -this.distance - l * 0.2, 
            -w, -this.distance - l * 0.5, 
            0 + this.curl * 20, -this.distance - l
        );
        
        // Right curve (back to start)
        ctx.bezierCurveTo(
            w, -this.distance - l * 0.5, 
            w / 2, -this.distance - l * 0.2, 
            0, -this.distance * this.growth
        );

        // Gradient for depth
        const gradient = ctx.createLinearGradient(0, -this.distance, 0, -this.distance - l);
        gradient.addColorStop(0, '#800f2f'); // Darker base
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#ffccd5'); // Light tip
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

class Rose {
    constructor(x, y, scale, layerCount = 8, onStemComplete = null) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        this.onStemComplete = onStemComplete;
        this.stemCompleteCalled = false;
        this.stemHeight = 0;
        this.maxStemHeight = height * 0.6 * scale + (Math.random() * 50);
        this.petals = [];
        // Initialize leaves with position and growth
        this.leaves = [
            { y: 100, angle: -0.5, growth: 0, side: -1 },
            { y: 200, angle: 0.5, growth: 0, side: 1 }
        ];
        this.time = 0; // Reset time to 0 for cleaner animations
        
        // Generate Petals in layers
        // Optimization: Allow variable layer count
        for (let i = 0; i < layerCount; i++) {
            const count = 3 + i * 2; 
            for (let j = 0; j < count; j++) {
                const angle = (j / count) * Math.PI * 2 + (i * 0.5); 
                const distance = i * 5; 
                const length = 40 + i * 20;
                const width = 30 + i * 15;
                const color = `hsl(${340 + Math.random() * 20}, 80%, ${40 + i * 5}%)`;
                
                this.petals.push(new Petal(angle, distance, length, width, color));
            }
        }
        this.petals.reverse();
    }

    update() {
        // Grow Stem
        if (this.stemHeight < this.maxStemHeight) {
            this.stemHeight += 1.5; 
            
            // Check if stem has reached a leaf position
            this.leaves.forEach(leaf => {
                if (this.stemHeight > leaf.y) {
                    // Leaf starts growing once stem passes it
                    leaf.growth = Math.min(1, leaf.growth + 0.02);
                }
            });
        } else {
            // Callback when stem finishes
            if (!this.stemCompleteCalled && this.onStemComplete) {
                this.stemCompleteCalled = true;
                this.onStemComplete();
            }

            // Bloom Petals
            this.time += 0.01;
            this.petals.forEach(p => p.update(this.time));
            
            // Ensure leaves are fully grown if not already
            this.leaves.forEach(leaf => {
                 leaf.growth = Math.min(1, leaf.growth + 0.01);
            });
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        // Local coordinates now (0,0 is base)
        const stemTopY = -this.stemHeight;
        const sway = Math.sin(this.time * 2 + this.x) * 5;
        
        // Draw Stem
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway, -this.stemHeight / 2, sway * 0.5, stemTopY);
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 10 - (this.stemHeight / (this.maxStemHeight/this.scale)) * 5; 
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw Leaves
        this.leaves.forEach(leaf => {
            if (this.stemHeight > leaf.y) {
                // Calculate leaf position based on stem sway at that height
                // Simple approximation: interpolate sway based on leaf height relative to current stem height
                const leafSway = (leaf.y / this.stemHeight) * sway * 0.5; // less sway lower down
                const swayAngle = sway * 0.01;
                this.drawLeaf(ctx, leafSway * 0.2, -leaf.y, leaf.angle + swayAngle, leaf.growth);
            }
        });

        // Petals (relative to stem top)
        this.petals.forEach(p => p.draw(ctx, sway * 0.5, stemTopY));
        
        ctx.restore();
    }
    
    drawLeaf(ctx, x, y, angle, growth) {
        if (growth <= 0) return;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(growth, growth); // Scale based on specific leaf growth
        
        ctx.beginPath();
        ctx.fillStyle = '#40916c';
        // Draw leaf shape
        ctx.ellipse(30, 0, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add vein
        ctx.beginPath();
        ctx.strokeStyle = '#2d6a4f';
        ctx.lineWidth = 1;
        ctx.moveTo(0, 0);
        ctx.lineTo(60, 0);
        ctx.stroke();
        
        ctx.restore();
    }
}

let roses = [];

function startFlower() {
    roses = [];
    
    // Background roses: Lower complexity (3-5 layers) for performance
    for(let i=0; i<6; i++) {
        const x = Math.random() * width;
        // Make them slightly larger/varied since they are the main focus now
        const scale = 0.4 + Math.random() * 0.4;
        const layers = Math.floor(Math.random() * 2) + 4; // 4 or 5 layers
        roses.push(new Rose(x, height + 20, scale, layers)); 
    }
    
    flowerStarted = true;
    document.body.style.backgroundColor = '#fae1dd'; 
    
    // Sort by scale so larger ones are on top
    roses.sort((a, b) => a.scale - b.scale);
}

// --- Particle Logic (Hearts) ---
class Heart {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 10 + 5; // Slightly adjusted size
        this.speedY = Math.random() * -3 - 1; 
        this.speedX = (Math.random() - 0.5) * 4;
        this.alpha = 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.color = `hsl(${340 + Math.random() * 20}, 90%, 60%)`;
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        this.alpha -= 0.005;
        this.speedY += 0.05; 
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        // Draw Heart Shape
        ctx.beginPath();
        const s = this.size;
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-s / 2, -s / 2, -s, 0, 0, s);
        ctx.bezierCurveTo(s, 0, s / 2, -s / 2, 0, 0);
        ctx.fill();
        
        ctx.restore();
    }
}

function spawnHearts() {
    if (Math.random() > 0.8) {
        particles.push(new Heart(Math.random() * width, height));
    }
}

// --- Animation Loop ---
function animate() {
    ctx.clearRect(0, 0, width, height);

    if (flowerStarted) {
        roses.forEach(rose => {
            rose.update();
            rose.draw(ctx);
        });
        spawnHearts(); 
    }
    
    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}
animate();

// --- UI Interactions ---

function handleYesClick() {
    console.log("Yes clicked");
    
    // Hide original question
    question.style.display = 'none';
    
    // Smooth fade out buttons
    const buttons = document.querySelector('.buttons');
    if(buttons) buttons.style.display = 'none';
    if(noBtn) noBtn.style.display = 'none'; // Force hide

    // Show Envelope logic moved to callback
    const envelope = document.getElementById('envelope');
    envelope.classList.remove('hidden');
    
    // Envelope Click Interaction
    // Using addEventListener is safer
    envelope.addEventListener('click', () => {
        console.log("Envelope clicked! Toggling open.");
        envelope.classList.add('open');
    });
    
    // Start flower and wait for it to finish growing stem
    startFlower();
    
    // Wait for background flowers to grow a bit
    setTimeout(() => {
        envelope.classList.add('show');
    }, 3000); // 3 seconds for background to fill in
}

let yesScale = 1;
function handleNoClick() {
    console.log("No clicked");
    
    // Reparent button to body so positioning is relative to viewport, not the centered .buttons container
    if (noBtn.parentNode !== document.body) {
        document.body.appendChild(noBtn);
    }
    
    // Get viewport dimensions
    const vW = window.innerWidth;
    const vH = window.innerHeight;
    
    // Safe zone: Keep button between 10% and 80% of screen to avoid edges
    const safeW = vW * 0.7; // Available width 70%
    const safeH = vH * 0.7; // Available height 70%
    const offsetX = vW * 0.15; // Start at 15%
    const offsetY = vH * 0.15; // Start at 15%
    
    const newLeft = offsetX + Math.random() * safeW;
    const newTop = offsetY + Math.random() * safeH;
    
    noBtn.style.position = 'absolute';
    noBtn.style.left = `${newLeft}px`;
    noBtn.style.top = `${newTop}px`;
    noBtn.style.zIndex = '1000'; // Make sure it sits on top of everything
    
    // Grow Yes Button
    yesScale += 0.3;
    // Removed size cap: if (yesScale > 3) yesScale = 3; 
    yesBtn.style.transform = `scale(${yesScale})`;
    
    // Ensure No button stays visible (z-index is already 100 in css)
}

yesBtn.addEventListener('click', handleYesClick);
yesBtn.addEventListener('touchstart', handleYesClick, {passive: true});

noBtn.addEventListener('click', handleNoClick);
noBtn.addEventListener('touchstart', handleNoClick, {passive: true});
