function showPage(pageId) {
            // Hide all pages
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => page.classList.remove('active'));
            
            // Show selected page
            document.getElementById(pageId).classList.add('active');
            
            // Update navigation buttons
            const buttons = document.querySelectorAll('.nav-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
        }

        // Add some interactive effects
        document.addEventListener('DOMContentLoaded', function() {
            // Add click effects to cards
            const cards = document.querySelectorAll('.character-card, .menu-item');
            cards.forEach(card => {
                card.addEventListener('click', function() {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                });
            });

            // Add hover effects to stat cards
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.animation = 'pulse 0.6s ease-in-out';
                });
                
                card.addEventListener('animationend', function() {
                    this.style.animation = '';
                });
            });
        });

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);


       
$(document).ready(function() {
   $('#viewOrderBtn').click(function() {
        var myModal = new bootstrap.Modal(document.getElementById('orderModal'), {});
        myModal.show();
    });
     $('#viewReceiptBtn').click(function() {
        var myModal = new bootstrap.Modal(document.getElementById('receiptModal'), {});
        myModal.show();
    });
});
var xValues2 = ["รายรับทั้งหมด", "รายรับจากเด็ก", "รายรับอาหาร", "จำนวนที่เด็กทำรอบวันนี้", "อื่นๆ"];
var yValues2 = [55, 49, 44, 24, 15];
var barColors = [
  "#b91d47",
  "#00aba9",
  "#2b5797",
  "#e8c3b9",
  "#1e7145"
];

new Chart("myChart2", {
  type: "pie",
  data: {
    labels: xValues2,
    datasets: [{
      backgroundColor: barColors,
      data: yValues2
    }]
  },
  options: {
    title: {
      display: true,
      text: "ข้อมูลของวันนี้"
    }
  }
});