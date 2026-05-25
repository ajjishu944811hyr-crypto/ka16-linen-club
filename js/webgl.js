// KA-16 LINEN CLUB — Premium 3D WebGL Cloth Scene
// Developed with Three.js via CDN

class WebGLClothScene {
    constructor() {
        this.container = document.getElementById('webgl-canvas-container');
        if (!this.container) return;

        this.init();
        this.createMesh();
        this.addLighting();
        this.addEventListeners();
        this.animate();
    }

    init() {
        // Create Scene
        this.scene = new THREE.Scene();

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 8);

        // Renderer setup with premium antialiasing
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Animation attributes
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2(0, 0);
        this.targetMouse = new THREE.Vector2(0, 0);
        this.scrollOffset = 0;
        this.targetScrollOffset = 0;
    }

    createMesh() {
        // High resolution plane geometry for realistic folds
        this.geometry = new THREE.PlaneGeometry(10, 6, 90, 60);

        // WebGL Vertex Shader — Dynamic Waves & Mouse Ripple Deformation
        const vertexShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            uniform float uScroll;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            // Strictly GLSL ES 1.00 compliant Simplex 2D noise
            vec3 permute(vec3 x) { return mod(((x*34.0)+vec3(1.0))*x, vec3(289.0)); }
            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + vec2(dot(v, C.yy)) );
                vec2 x0 = v -   i + vec2(dot(i, C.xx)) ;
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod(i, vec2(289.0));
                vec3 p = permute( permute( vec3(i.y) + vec3(0.0, i1.y, 1.0 ))
                + vec3(i.x) + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(vec3(0.5) - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                dot(x12.zw,x12.zw)), vec3(0.0));
                m = m*m ;
                m = m*m ;
                vec3 x = vec3(2.0) * fract(p * vec3(C.www)) - vec3(1.0);
                vec3 h = abs(x) - vec3(0.5);
                vec3 a0 = x - floor(x + vec3(0.5));
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vUv = uv;
                
                // Base cloth position
                vec3 pos = position;

                // 1. Organic fabric flow (combining two noise frequencies)
                float noise1 = snoise(pos.xy * vec2(0.25) + vec2(uTime * 0.35)) * 0.45;
                float noise2 = snoise(pos.xy * vec2(0.6) + vec2(uTime * 0.65)) * 0.15;
                float baseWaves = noise1 + noise2;

                // 2. Interactive mouse gravity/ripple displacement
                float dist = distance(pos.xy, uMouse * vec2(5.0, 3.0));
                float mouseForce = smoothstep(2.5, 0.0, dist) * 0.35;
                float mouseRipple = sin(dist * 4.0 - uTime * 3.0) * mouseForce * 0.15;

                // 3. Scroll inertia reaction (warping the bottom slightly)
                float scrollDeform = sin(pos.x * 0.5) * uScroll * 0.003;

                // Displace Z axis (creating depth folds)
                pos.z += baseWaves + mouseRipple - (mouseForce * 0.15) + scrollDeform;

                // Calculate analytical normal vector for dynamic, gorgeous highlights
                // We estimate partial derivatives along the X and Y plane axes
                float eps = 0.05;
                float wX1 = snoise(vec2(position.x + eps, position.y) * vec2(0.25) + vec2(uTime * 0.35)) * 0.45;
                float wX2 = snoise(vec2(position.x + eps, position.y) * vec2(0.6) + vec2(uTime * 0.65)) * 0.15;
                float zX = wX1 + wX2;

                float wY1 = snoise(vec2(position.x, position.y + eps) * vec2(0.25) + vec2(uTime * 0.35)) * 0.45;
                float wY2 = snoise(vec2(position.x, position.y + eps) * vec2(0.6) + vec2(uTime * 0.65)) * 0.15;
                float zY = wY1 + wY2;

                float dzdx = (zX - baseWaves) / eps;
                float dzdy = (zY - baseWaves) / eps;

                // Output normals and positions to fragment shader
                vNormal = normalize(vec3(-dzdx, -dzdy, 1.0));
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                vViewPosition = -mvPosition.xyz;
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        // WebGL Fragment Shader — Matte Luxury Beige Linen Texture & Soft Lighting
        const fragmentShader = `
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                // Core color system: Matte Beige (#D8C3A5) & Deep Charcoal shadow hints
                vec3 baseColor = vec3(0.847, 0.765, 0.647); // Luxury Beige (#D8C3A5)
                vec3 shadowColor = vec3(0.12, 0.11, 0.10);  // Deep organic shadow
                
                // Normal interpolation
                vec3 normal = normalize(vNormal);
                
                // Soft cinematic lighting calculations
                vec3 lightDir1 = normalize(vec3(1.0, 1.0, 2.0)); // Soft gold key light
                vec3 lightDir2 = normalize(vec3(-1.0, -1.0, 1.0)); // Ambient cool fill
                
                // Diffuse components
                float diffuse1 = max(dot(normal, lightDir1), 0.0);
                float diffuse2 = max(dot(normal, lightDir2), 0.0) * 0.4;
                
                // Luxury Micro-texture simulating real linen weaves
                float weavePattern = sin(vUv.x * 800.0) * sin(vUv.y * 600.0);
                float weaveIntensity = 0.035;
                vec3 textureEffect = vec3(1.0 + weavePattern * weaveIntensity);

                // Blend light and shadow
                vec3 lighting = baseColor * (diffuse1 * 0.8 + diffuse2 + 0.35);
                vec3 finalColor = mix(shadowColor * 0.15, lighting, diffuse1 + 0.3);
                finalColor *= textureEffect;

                // Rich Gold highlight overlays in high lighting areas
                float specular = pow(diffuse1, 16.0) * 0.15;
                vec3 goldAccent = vec3(0.784, 0.663, 0.420) * specular; // Gold (#C8A96B)

                gl_FragColor = vec4(finalColor + goldAccent, 0.96);
            }
        `;

        // Shader material mapping parameters
        this.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uTime: { value: 0.0 },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uScroll: { value: 0.0 }
            },
            transparent: true,
            side: THREE.DoubleSide
        });

        this.clothMesh = new THREE.Mesh(this.geometry, this.material);
        // Slightly rotate for organic flow alignment
        this.clothMesh.rotation.set(-0.15, 0.05, 0.05);
        this.scene.add(this.clothMesh);
    }

    addLighting() {
        // High quality luxury ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        // Gold key directional light
        this.keyLight = new THREE.DirectionalLight(0xd8c3a5, 1.2);
        this.keyLight.position.set(5, 5, 4);
        this.scene.add(this.keyLight);

        // Gold fill directional light
        this.fillLight = new THREE.DirectionalLight(0xc8a96b, 0.6);
        this.fillLight.position.set(-5, -3, 2);
        this.scene.add(this.fillLight);
    }

    addEventListeners() {
        // Track mouse coords mapped smoothly
        window.addEventListener('mousemove', (e) => {
            // Map coordinates between -1 and 1
            this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        // Track scroll events to deform fabric on vertical transition
        window.addEventListener('scroll', () => {
            this.targetScrollOffset = window.scrollY;
        });

        // Handle viewport adjustments gracefully
        window.addEventListener('resize', () => {
            if (!this.container) return;
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();

        // Smooth mouse coordinates tracking (linear interpolation lag)
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

        // Smooth scroll inertia displacement tracking
        const scrollDelta = this.targetScrollOffset - this.scrollOffset;
        this.scrollOffset += scrollDelta * 0.1;
        
        // Pass parameters into shader uniforms
        if (this.material) {
            this.material.uniforms.uTime.value = time;
            this.material.uniforms.uMouse.value.copy(this.mouse);
            this.material.uniforms.uScroll.value = scrollDelta;
        }

        // Add visual expensive dynamic camera float (cinematic effect)
        this.camera.position.x = this.mouse.x * 0.35;
        this.camera.position.y = this.mouse.y * 0.2;
        this.camera.lookAt(0, 0, 0);

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialise the WebGL Experience on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait slightly to coordinate smooth entrance reveal
    setTimeout(() => {
        window.webglScene = new WebGLClothScene();
    }, 100);
});
