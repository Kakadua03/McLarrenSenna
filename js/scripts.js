/*!
* Start Bootstrap - Scrolling Nav v5.0.6 (https://startbootstrap.com/template/scrolling-nav)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-scrolling-nav/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

        /* =========================
       Gallery Logic
       ========================= */
        const galleryItems = [
        {
            image: "https://images.unsplash.com/photo-1712095314770-5ea32f8b0505?q=80&w=2670&auto=format&fit=crop",
            text: "McLaren Senna - Track-focused Hypercar",
            link: "gallerydescriptionpages/firstpicture.html"
        },
        {
            image: "https://images.unsplash.com/photo-1602182244320-12e14faa479f?q=80&w=2670&auto=format&fit=crop",
            text: "The McLaren Senna in LEGO form",
            link: "gallerydescriptionpages/secondpicture.html"
        },
        {
            image: "https://images.unsplash.com/photo-1623476950375-368107fffaa9?q=80&w=3870&auto=format&fit=crop",
            text: "Built for maximum downforce",
            link: "gallerydescriptionpages/thirdpicture.html"
        },
        {
            image: "https://cdn.pixabay.com/photo/2023/10/20/06/51/car-8328373_1280.jpg",
            text: "Lightweight. Powerful. Uncompromising.",
            link: "gallerydescriptionpages/fourthpicture.html"
        }
    ];


    let currentIndex = 0;
    const galleryImage = document.getElementById("galleryImage");
    const galleryCaption = document.getElementById("galleryCaption");

    const galleryLink = document.getElementById("galleryLink");

    function updateGallery() {
        galleryImage.src = galleryItems[currentIndex].image;
        galleryCaption.textContent = galleryItems[currentIndex].text;
        galleryLink.href = galleryItems[currentIndex].link;
    }

    window.nextImage = function () {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        updateGallery();
    };

    window.prevImage = function () {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        updateGallery();
    };

});
