$(document).ready(function() {
    // ตรวจสอบว่าไลบรารีที่จำเป็นโหลดมาครบหรือไม่
    if (typeof THREE === 'undefined') {
        console.error("THREE.js has not been loaded.");
        $('#loading p').text('เกิดข้อผิดพลาด: ไม่สามารถโหลดไลบรารี 3D ได้');
        return;
    }

    // ตัวแปรสำหรับ Three.js และสถานะของประตู
    let scene, camera, renderer, door, frame, controls;
    let doorType = 'single';
    let doorWidth = 80, doorHeight = 200, doorThickness = 4;
    let doorColor = '#8B4513';
    let doorMaterial = 'ไม้สัก';
    let isAnimating = false;
    let wireframeMode = false;
    let isDoorOpen = false;

    // ฟังก์ชันเริ่มต้นระบบ 3D ทั้งหมด
    function init3D() {
        const canvas = document.getElementById('door3D');
        const canvasContainer = canvas.parentElement;

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x34495e);

        // Camera
        camera = new THREE.PerspectiveCamera(75, canvasContainer.offsetWidth / canvasContainer.offsetHeight, 0.1, 1000);
        camera.position.set(0, doorHeight / 2, 180); // ปรับตำแหน่งเริ่มต้นของกล้อง

        // Renderer
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(80, 150, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(500, 500);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0; // ตั้งพื้นไว้ที่ y=0
        floor.receiveShadow = true;
        scene.add(floor);

        // Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, doorHeight / 2, 0); // ให้กล้องมองไปที่กลางประตู
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.minDistance = 80;
        controls.maxDistance = 300;
        controls.update();

        // สร้างประตูเริ่มต้น
        createDoor();

        // เริ่มการ Render
        animate();
        $('#loading').fadeOut();

        // จัดการเมื่อขนาดหน้าจอเปลี่ยน
        window.addEventListener('resize', onWindowResize, false);
    }

    // ฟังก์ชันสำหรับสร้างประตูใหม่
    function createDoor() {
        if (door) scene.remove(door);
        if (frame) scene.remove(frame);

        door = new THREE.Group();
        frame = new THREE.Group();
        
        // จัดตำแหน่งให้ฐานของประตูและวงกบอยู่ที่ y=0
        door.position.y = doorHeight / 2;
        frame.position.y = doorHeight / 2;
        
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

        // อัปเดตเป้าหมายของกล้องตามความสูงใหม่
        if (controls) {
            controls.target.set(0, doorHeight / 2, 0);
        }
        updateInfo();
    }
    
    // สร้างวงกบ
    function createDoorFrame() {
        const frameWidth = 5;
        const frameDepth = doorThickness + 2;
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x5C3D2E, roughness: 0.7 });

        const sideFrameGeometry = new THREE.BoxGeometry(frameWidth, doorHeight + frameWidth, frameDepth);
        const leftFrame = new THREE.Mesh(sideFrameGeometry, frameMaterial);
        leftFrame.position.set(-doorWidth / 2 - frameWidth / 2, 0, 0);
        leftFrame.castShadow = true;
        frame.add(leftFrame);

        const rightFrame = leftFrame.clone();
        rightFrame.position.x = doorWidth / 2 + frameWidth / 2;
        frame.add(rightFrame);

        const topFrame = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + frameWidth * 2, frameWidth, frameDepth), frameMaterial);
        topFrame.position.set(0, doorHeight / 2 + frameWidth / 2, 0);
        topFrame.castShadow = true;
        frame.add(topFrame);
    }

    // สร้างประตูเดี่ยว
    function createSingleDoor() {
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), doorMat);
        doorPanel.castShadow = true;

        const pivot = new THREE.Group();
        pivot.add(doorPanel);
        doorPanel.position.x = doorWidth / 2;
        pivot.position.x = -doorWidth / 2;
        
        door.add(pivot);
        door.userData.pivot = pivot;
    }

    // สร้างประตูคู่
    function createDoubleDoor() {
        const panelWidth = doorWidth / 2;
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        
        const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, doorHeight, doorThickness), doorMat);
        leftPanel.castShadow = true;
        const leftPivot = new THREE.Group();
        leftPivot.add(leftPanel);
        leftPanel.position.x = panelWidth / 2;
        leftPivot.position.x = -panelWidth;

        const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, doorHeight, doorThickness), doorMat);
        rightPanel.castShadow = true;
        const rightPivot = new THREE.Group();
        rightPivot.add(rightPanel);
        rightPanel.position.x = -panelWidth / 2;
        rightPivot.position.x = panelWidth;

        door.add(leftPivot);
        door.add(rightPivot);
        door.userData.leftPivot = leftPivot;
        door.userData.rightPivot = rightPivot;
    }
    
    // สร้างประตูเลื่อน
    function createSlidingDoor() {
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness), doorMat);
        doorPanel.castShadow = true;
        door.add(doorPanel);
        door.userData.panel = doorPanel;
    }

    // สร้างประตูพับ
    function createFoldingDoor() {
        const panelWidth = doorWidth / 4;
        const doorMat = new THREE.MeshStandardMaterial({ color: doorColor, wireframe: wireframeMode, roughness: 0.6 });
        
        let pivots = [];
        let currentPivot = door;
        
        for (let i = 0; i < 4; i++) {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, doorHeight, doorThickness), doorMat);
            panel.castShadow = true;
            panel.position.x = panelWidth / 2;

            const pivot = new THREE.Group();
            pivot.add(panel);
            
            pivot.position.x = (i === 0) ? -doorWidth / 2 : panelWidth;

            currentPivot.add(pivot);
            currentPivot = pivot;
            pivots.push(pivot);
        }
        door.userData.pivots = pivots;
    }
    
    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        TWEEN.update();
        controls.update();
        renderer.render(scene, camera);
    }
    
    // อัปเดตข้อมูลใน Info Panel
    function updateInfo() {
        $('#doorTypeInfo').text($('.door-template.active').text().trim().replace('🚪', '').replace('↔️', '').replace('🪗', '').replace('<br>', ''));
        $('#doorSizeInfo').text(`${doorWidth}×${doorHeight}×${doorThickness} ซม.`);
        $('#doorMaterialInfo').text(doorMaterial);
        
        const area = (doorWidth * doorHeight) / 10000;
        let basePrice = 3000;
        if(doorMaterial === 'ไม้สัก') basePrice = 5000;
        if(doorMaterial === 'เหล็ก') basePrice = 4000;
        if(doorMaterial === 'กระจก') basePrice = 6000;
        let finalPrice = basePrice * area * (doorThickness / 4);
        $('#doorPriceInfo').text(`฿${Math.round(finalPrice).toLocaleString()} - ${Math.round(finalPrice * 1.5).toLocaleString()}`);
    }

    // จัดการเมื่อขนาดหน้าจอเปลี่ยน
    function onWindowResize() {
        const canvasContainer = renderer.domElement.parentElement;
        camera.aspect = canvasContainer.offsetWidth / canvasContainer.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    }

    // --- UI Event Handlers ---

    $('.door-template').on('click', function() {
        $('.door-template').removeClass('active');
        $(this).addClass('active');
        doorType = $(this).data('type');
        createDoor();
    });

    $('#doorWidth, #doorHeight, #doorThickness').on('input', function() {
        doorWidth = parseInt($('#doorWidth').val());
        doorHeight = parseInt($('#doorHeight').val());
        doorThickness = parseInt($('#doorThickness').val());
        
        $('#widthValue').text(doorWidth + ' ซม.');
        $('#heightValue').text(doorHeight + ' ซม.');
        $('#thicknessValue').text(doorThickness + ' ซม.');
        
        createDoor();
    });

    $('.color-option').on('click', function() {
        $('.color-option').removeClass('active');
        $(this).addClass('active');
        doorColor = $(this).data('color');
        
        door.traverse((child) => {
            if (child.isMesh) {
                child.material.color.set(doorColor);
            }
        });
    });

    $('#doorMaterial').on('change', function() {
        doorMaterial = $(this).find('option:selected').text();
        updateInfo();
    });

    $('#resetView').on('click', function() {
        controls.reset();
        camera.position.set(0, doorHeight / 2, 180);
        controls.target.set(0, doorHeight / 2, 0);
    });

    $('#toggleWireframe').on('click', function() {
        wireframeMode = !wireframeMode;
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.wireframe = wireframeMode;
            }
        });
    });

    $('#toggleAnimation').on('click', function() {
        if (isAnimating) return;
        isAnimating = true;
        
        const targetRotation = isDoorOpen ? 0 : -Math.PI / 2;
        const slideTarget = isDoorOpen ? 0 : -doorWidth * 0.9;
        const foldTarget = isDoorOpen ? 0 : -Math.PI / 2;

        const onComplete = () => { isAnimating = false; isDoorOpen = !isDoorOpen; };

        switch(doorType) {
            case 'single':
                new TWEEN.Tween(door.userData.pivot.rotation).to({ y: targetRotation }, 500).easing(TWEEN.Easing.Quadratic.Out).onComplete(onComplete).start();
                break;
            case 'double':
                new TWEEN.Tween(door.userData.leftPivot.rotation).to({ y: targetRotation }, 500).easing(TWEEN.Easing.Quadratic.Out).start();
                new TWEEN.Tween(door.userData.rightPivot.rotation).to({ y: -targetRotation }, 500).easing(TWEEN.Easing.Quadratic.Out).onComplete(onComplete).start();
                break;
            case 'sliding':
                new TWEEN.Tween(door.userData.panel.position).to({ x: slideTarget }, 500).easing(TWEEN.Easing.Quadratic.Out).onComplete(onComplete).start();
                break;
            case 'folding':
                door.userData.pivots.forEach((pivot, i) => {
                   new TWEEN.Tween(pivot.rotation).to({ y: (i % 2 === 0 ? foldTarget : -foldTarget) }, 700).easing(TWEEN.Easing.Quadratic.Out).onComplete(i === 3 ? onComplete : null).start();
                });
                break;
        }
    });

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
        const body = encodeURIComponent(
`สวัสดีครับ/ค่ะ,

ผมได้ออกแบบประตูตามรายละเอียดด้านล่างนี้ครับ:
- ประเภท: ${$('#doorTypeInfo').text()}
- ขนาด: ${$('#doorSizeInfo').text()}
- วัสดุ: ${$('#doorMaterialInfo').text()}
- สี: ${$('.color-option.active').prop('title')}
- ราคาประมาณ: ${$('#doorPriceInfo').text()}

รบกวนพิจารณาแบบด้วยค่ะ
ขอบคุณค่ะ`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });

    // เริ่มต้นการทำงานทั้งหมด
    init3D();
});