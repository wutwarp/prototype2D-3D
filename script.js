$(document).ready(function() {
    // Check if THREE is loaded
    if (typeof THREE === 'undefined') {
        console.error("THREE.js has not been loaded. Make sure to include it before this script.");
        $('#loading p').text('Error: Could not load 3D library.');
        return;
    }

    // Three.js variables
    let scene, camera, renderer, door, frame, controls;
    let doorType = 'single';
    let doorWidth = 80, doorHeight = 200, doorThickness = 4;
    let doorColor = '#8B4513';
    let doorMaterial = 'ไม้สัก'; // Default material name
    let isAnimating = false;
    let wireframeMode = false;
    let isDoorOpen = false;

    // Initialize the 3D system
    function init3D() {
        const canvas = document.getElementById('door3D');
        const canvasContainer = canvas.parentElement;

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x34495e);

        // Camera
        camera = new THREE.PerspectiveCamera(75, canvasContainer.offsetWidth / canvasContainer.offsetHeight, 0.1, 1000);
        camera.position.set(0, 10, 150); // Adjusted initial camera position

        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(80, 100, 60);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5, 300);
        pointLight.position.set(-80, 80, 80);
        scene.add(pointLight);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(500, 500);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -doorHeight / 2 -1; // Align with bottom of door
        floor.receiveShadow = true;
        scene.add(floor);

        // Initial door creation
        createDoor();

        // OrbitControls for better camera interaction
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 80;
        controls.maxDistance = 250;
        controls.target.set(0, 0, 0);

        // Start rendering
        animate();

        // Hide loading overlay
        $('#loading').fadeOut();

        // Handle window resizing
        window.addEventListener('resize', onWindowResize, false);
    }

    // Create a new door
    function createDoor() {
        if (door) scene.remove(door);
        if (frame) scene.remove(frame);

        door = new THREE.Group();
        frame = new THREE.Group();
        
        // Reset door state
        isDoorOpen = false;

        createDoorFrame();

        switch (doorType) {
            case 'single': createSingleDoor(); break;
            case 'double': createDoubleDoor(); break;
            case 'sliding': createSlidingDoor(); break;
            case 'folding': createFoldingDoor(); break;
        }

        scene.add(door);
        scene.add(frame);
        
        // Position door group correctly relative to the floor
        door.position.y = doorHeight / 2;
        frame.position.y = doorHeight / 2;


        updateInfo();
    }
    
    // Create door frame
    function createDoorFrame() {
        const frameWidth = 5;
        const frameDepth = doorThickness + 2;
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D2E, roughness: 0.7 });

        const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, doorHeight + frameWidth, frameDepth), frameMaterial);
        leftFrame.position.set(-(doorWidth / 2) - (frameWidth / 2), 0, -(frameDepth - doorThickness)/2);
        leftFrame.castShadow = true;
        frame.add(leftFrame);

        const rightFrame = leftFrame.clone();
        rightFrame.position.x = (doorWidth / 2) + (frameWidth / 2);
        frame.add(rightFrame);

        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + (frameWidth * 2), frameWidth, frameDepth), frameMaterial);
        topFrame.position.set(0, (doorHeight / 2) + (frameWidth / 2), -(frameDepth - doorThickness)/2);
        topFrame.castShadow = true;
        frame.add(topFrame);
    }

    // Create single door
    function createSingleDoor() {
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), doorMat);
        doorPanel.castShadow = true;
        doorPanel.receiveShadow = true;

        const doorPivot = new THREE.Group();
        doorPivot.add(doorPanel);
        doorPanel.position.x = doorWidth / 2;
        doorPivot.position.x = -doorWidth / 2;
        
        door.add(doorPivot);
        door.userData.pivot = doorPivot;
    }

    // Create double door
    function createDoubleDoor() {
        const panelWidth = doorWidth / 2;
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        
        const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, doorHeight, doorThickness), doorMat);
        leftPanel.castShadow = true;
        leftPanel.receiveShadow = true;
        const leftPivot = new THREE.Group();
        leftPivot.add(leftPanel);
        leftPanel.position.x = panelWidth / 2;
        leftPivot.position.x = -panelWidth;

        const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, doorHeight, doorThickness), doorMat);
        rightPanel.castShadow = true;
        rightPanel.receiveShadow = true;
        const rightPivot = new THREE.Group();
        rightPivot.add(rightPanel);
        rightPanel.position.x = -panelWidth / 2;
        rightPivot.position.x = panelWidth;

        door.add(leftPivot);
        door.add(rightPivot);
        door.userData.leftPivot = leftPivot;
        door.userData.rightPivot = rightPivot;
    }
    
    // Create sliding door
    function createSlidingDoor() {
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), doorMat);
        doorPanel.castShadow = true;
        doorPanel.receiveShadow = true;
        door.add(doorPanel);
        door.userData.panel = doorPanel;
    }

    // Create folding door
    function createFoldingDoor() {
        const panelWidth = doorWidth / 4;
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        
        let pivots = [];
        let currentPivot = door;
        
        for (let i = 0; i < 4; i++) {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, doorHeight, doorThickness), doorMat);
            panel.castShadow = true;
            panel.receiveShadow = true;
            panel.position.x = panelWidth / 2;

            const pivot = new THREE.Group();
            pivot.add(panel);
            
            if (i === 0) {
                 pivot.position.x = -doorWidth/2;
            } else {
                 pivot.position.x = panelWidth;
            }

            currentPivot.add(pivot);
            currentPivot = pivot;
            pivots.push(pivot);
        }
        door.userData.pivots = pivots;
    }
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        if (TWEEN) TWEEN.update();
        controls.update();
        renderer.render(scene, camera);
    }
    
    // Update info panel
    function updateInfo() {
        $('#doorTypeInfo').text($('.door-template.active').text().trim().replace('<br>', ' '));
        $('#doorSizeInfo').text(`${doorWidth}×${doorHeight}×${doorThickness} ซม.`);
        $('#doorMaterialInfo').text(doorMaterial);
        
        // Simple price estimation
        const area = (doorWidth * doorHeight) / 10000; // in sq meters
        let basePrice = 3000;
        if(doorMaterial === 'ไม้สัก') basePrice = 5000;
        if(doorMaterial === 'เหล็ก') basePrice = 4000;
        if(doorMaterial === 'กระจก') basePrice = 6000;
        let finalPrice = basePrice * area * (doorThickness / 4);
        $('#doorPriceInfo').text(`฿${Math.round(finalPrice).toLocaleString()} - ${Math.round(finalPrice * 1.5).toLocaleString()}`);
    }

    // Window resize handler
    function onWindowResize() {
        const canvasContainer = renderer.domElement.parentElement;
        camera.aspect = canvasContainer.offsetWidth / canvasContainer.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    }

    // --- UI Event Handlers ---

    // Door templates
    $('.door-template').on('click', function() {
        $('.door-template').removeClass('active');
        $(this).addClass('active');
        doorType = $(this).data('type');
        createDoor();
    });

    // Sliders
    $('#doorWidth').on('input', function() {
        doorWidth = parseInt($(this).val());
        $('#widthValue').text(doorWidth + ' ซม.');
        createDoor();
    });

    $('#doorHeight').on('input', function() {
        doorHeight = parseInt($(this).val());
        $('#heightValue').text(doorHeight + ' ซม.');
        // Adjust floor and recreate door
        scene.getObjectByName('floor').position.y = -doorHeight / 2 - 1;
        createDoor();
    });

    $('#doorThickness').on('input', function() {
        doorThickness = parseInt($(this).val());
        $('#thicknessValue').text(doorThickness + ' ซม.');
        createDoor();
    });

    // Color picker
    $('.color-option').on('click', function() {
        $('.color-option').removeClass('active');
        $(this).addClass('active');
        doorColor = $(this).data('color');
        
        // Update color without rebuilding geometry
        door.traverse((child) => {
            if (child.isMesh) {
                child.material.color.set(doorColor);
            }
        });
    });

    // Material selector
    $('#doorMaterial').on('change', function() {
        doorMaterial = $(this).find('option:selected').text();
        updateInfo();
    });

    // Viewer controls
    $('#resetView').on('click', function() {
        controls.reset();
        camera.position.set(0, 10, 150);
        controls.target.set(0, 0, 0);
    });

    $('#toggleWireframe').on('click', function() {
        wireframeMode = !wireframeMode;
        door.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = wireframeMode;
            }
        });
    });

    // Animation toggle
    $('#toggleAnimation').on('click', function() {
        if (isAnimating) return;
        isAnimating = true;
        
        const targetRotation = isDoorOpen ? 0 : Math.PI / 2;
        const slideTarget = isDoorOpen ? 0 : doorWidth * 0.9;
        const foldTarget = isDoorOpen ? 0 : Math.PI / 2;

        const onComplete = () => {
            isAnimating = false;
            isDoorOpen = !isDoorOpen;
        };

        switch(doorType) {
            case 'single':
                new TWEEN.Tween(door.userData.pivot.rotation)
                    .to({ y: targetRotation }, 500)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onComplete(onComplete)
                    .start();
                break;
            case 'double':
                new TWEEN.Tween(door.userData.leftPivot.rotation)
                    .to({ y: targetRotation }, 500)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .start();
                new TWEEN.Tween(door.userData.rightPivot.rotation)
                    .to({ y: -targetRotation }, 500)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onComplete(onComplete)
                    .start();
                break;
            case 'sliding':
                new TWEEN.Tween(door.userData.panel.position)
                    .to({ x: slideTarget }, 500)
                    .easing(TWEEN.Easing.Quadratic.Out)
                    .onComplete(onComplete)
                    .start();
                break;
            case 'folding':
                door.userData.pivots.forEach((pivot, i) => {
                   new TWEEN.Tween(pivot.rotation)
                       .to({ y: (i % 2 === 0 ? foldTarget : -foldTarget) }, 700)
                       .easing(TWEEN.Easing.Quadratic.Out)
                       .onComplete(i === 3 ? onComplete : null)
                       .start();
                });
                break;
        }
    });

    // Export buttons
    $('#exportImage').on('click', function() {
        const link = document.createElement('a');
        link.download = 'door-design.png';
        link.href = renderer.domElement.toDataURL('image/png');
        link.click();
    });

    $('#exportSpecs').on('click', function() {
        const specs = `
ระบบออกแบบประตูและวงกบ 3D - สเปค
------------------------------------
ประเภทประตู: ${$('#doorTypeInfo').text()}
ขนาด (กว้างxสูงxหนา): ${$('#doorSizeInfo').text()}
วัสดุ: ${$('#doorMaterialInfo').text()}
สี: ${$('.color-option.active').prop('title')} (${doorColor})
ราคาประมาณ: ${$('#doorPriceInfo').text()}
        `;
        const blob = new Blob([specs.trim()], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = 'door-specs.txt';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    });

    $('#sendToArchitect').on('click', function() {
        const subject = encodeURIComponent('แบบประตู 3D สำหรับโปรเจค');
        const body = encodeURIComponent(`
สวัสดีครับ/ค่ะ,

ผมได้ออกแบบประตูตามรายละเอียดด้านล่างนี้ครับ:
- ประเภท: ${$('#doorTypeInfo').text()}
- ขนาด: ${$('#doorSizeInfo').text()}
- วัสดุ: ${$('#doorMaterialInfo').text()}
- สี: ${$('.color-option.active').prop('title')}
- ราคาประมาณ: ${$('#doorPriceInfo').text()}

รบกวนพิจารณาแบบด้วยครับ
ขอบคุณครับ/ค่ะ
        `);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });

    // Initial setup
    // Add Tween.js and OrbitControls if they aren't already on the page
    function loadScript(url, callback) {
        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        script.onload = callback;
        document.head.appendChild(script);
    }
    
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js", function() {
        loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js", function() {
             init3D();
        });
    });
});