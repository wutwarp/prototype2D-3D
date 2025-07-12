  const canvas = document.getElementById('floorPlan');
        const ctx = canvas.getContext('2d');
        let rooms = [];
        let selectedRoom = null;
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let roomIdCounter = 0;

        // ข้อมูลห้องต่าง ๆ
        const roomData = {
            bedroom: { icon: '🛏️', name: 'ห้องนอน', color: '#667eea', size: { width: 120, height: 100 } },
            bathroom: { icon: '🚿', name: 'ห้องน้ำ', color: '#5f9ea0', size: { width: 80, height: 80 } },
            kitchen: { icon: '🍳', name: 'ห้องครัว', color: '#ff6b6b', size: { width: 100, height: 80 } },
            living: { icon: '🛋️', name: 'ห้องรับแขก', color: '#4ecdc4', size: { width: 150, height: 120 } },
            dining: { icon: '🍽️', name: 'ห้องอาหาร', color: '#45b7d1', size: { width: 100, height: 100 } },
            office: { icon: '💻', name: 'ห้องทำงาน', color: '#96ceb4', size: { width: 100, height: 80 } },
            storage: { icon: '📦', name: 'ห้องเก็บของ', color: '#feca57', size: { width: 60, height: 60 } },
            balcony: { icon: '🌿', name: 'ระเบียง', color: '#48dbfb', size: { width: 80, height: 120 } }
        };

        function resizeCanvas() {
            const container = canvas.parentElement;
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
            drawFloorPlan();
        }

        function drawGrid() {
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            
            const gridSize = 20;
            for (let x = 0; x <= canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y <= canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        function drawFloorPlan() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // วาดพื้นหลัง
            ctx.fillStyle = '#f8f9fa';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // วาดเส้นตาราง
            drawGrid();
            
            // วาดห้องต่าง ๆ
            rooms.forEach(room => {
                drawRoom(room);
            });
            
            updateInfo();
        }

        function drawRoom(room) {
            const data = roomData[room.type];
            
            // วาดพื้นหลัง
            ctx.fillStyle = room.selected ? '#ff6b6b' : data.color;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(room.x, room.y, room.width, room.height);
            ctx.globalAlpha = 1;
            
            // วาดเส้นขอบ
            ctx.strokeStyle = room.selected ? '#ff4757' : '#2f3542';
            ctx.lineWidth = room.selected ? 3 : 2;
            ctx.strokeRect(room.x, room.y, room.width, room.height);
            
            // วาดข้อความ
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const centerX = room.x + room.width / 2;
            const centerY = room.y + room.height / 2;
            
            // วาดไอคอน
            ctx.font = '20px Arial';
            ctx.fillText(data.icon, centerX, centerY - 10);
            
            // วาดชื่อห้อง
            ctx.font = '12px Arial';
            ctx.fillText(data.name, centerX, centerY + 12);
            
            // วาดขนาด
            ctx.font = '10px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${Math.round(room.width/10)}×${Math.round(room.height/10)}ม.`, centerX, centerY + 25);
        }

        function updateInfo() {
            document.getElementById('roomCount').textContent = rooms.length;
            const totalArea = rooms.reduce((sum, room) => sum + (room.width * room.height) / 100, 0);
            document.getElementById('totalArea').textContent = Math.round(totalArea);
        }

        function snapToGrid(value, gridSize = 20) {
            return Math.round(value / gridSize) * gridSize;
        }

        function getRoomAt(x, y) {
            return rooms.find(room => 
                x >= room.x && x <= room.x + room.width &&
                y >= room.y && y <= room.y + room.height
            );
        }

        // Event Listeners
        document.querySelectorAll('.room-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.room);
            });
        });

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const roomType = e.dataTransfer.getData('text/plain');
            const rect = canvas.getBoundingClientRect();
            const x = snapToGrid(e.clientX - rect.left);
            const y = snapToGrid(e.clientY - rect.top);
            
            const data = roomData[roomType];
            const newRoom = {
                id: roomIdCounter++,
                type: roomType,
                x: x,
                y: y,
                width: data.size.width,
                height: data.size.height,
                selected: false
            };
            
            rooms.push(newRoom);
            drawFloorPlan();
        });

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const clickedRoom = getRoomAt(x, y);
            
            // ยกเลิกการเลือกห้องอื่น ๆ
            rooms.forEach(room => room.selected = false);
            
            if (clickedRoom) {
                clickedRoom.selected = true;
                selectedRoom = clickedRoom;
                isDragging = true;
                dragOffset.x = x - clickedRoom.x;
                dragOffset.y = y - clickedRoom.y;
            } else {
                selectedRoom = null;
            }
            
            drawFloorPlan();
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDragging && selectedRoom) {
                const rect = canvas.getBoundingClientRect();
                const x = snapToGrid(e.clientX - rect.left - dragOffset.x);
                const y = snapToGrid(e.clientY - rect.top - dragOffset.y);
                
                selectedRoom.x = Math.max(0, Math.min(x, canvas.width - selectedRoom.width));
                selectedRoom.y = Math.max(0, Math.min(y, canvas.height - selectedRoom.height));
                
                drawFloorPlan();
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && selectedRoom) {
                rooms = rooms.filter(room => room.id !== selectedRoom.id);
                selectedRoom = null;
                drawFloorPlan();
            }
        });

        function clearAll() {
            if (confirm('คุณต้องการลบแปลนทั้งหมดหรือไม่?')) {
                rooms = [];
                selectedRoom = null;
                drawFloorPlan();
            }
        }

        function saveDesign() {
            const design = {
                rooms: rooms,
                timestamp: new Date().toISOString(),
                canvasSize: { width: canvas.width, height: canvas.height }
            };
            
            const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'floor-plan-design.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        function exportDesign() {
            const link = document.createElement('a');
            link.download = 'floor-plan.png';
            link.href = canvas.toDataURL();
            link.click();
        }

        // Initialize
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();