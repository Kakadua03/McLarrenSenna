/*!
* Start Bootstrap - Scrolling Nav v5.0.6
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT
*/

window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    }

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );

    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    /* =========================
       Gallery Logic
    ========================= */

    const galleryItems = [
        {
            image: "../assets/first-picture.jpg",
            link: "gallerydescriptionpages/firstpicture.html",
            text: "Bild 1"
        },
        {
            image: "../assets/second-picture.jpg",
            link: "gallerydescriptionpages/secondpicture.html",
            text: "Bild 2"
        },
        {
            image: "../assets/third-picture.jpg",
            link: "gallerydescriptionpages/thirdpicture.html",
            text: "Bild 3"
        },
        {
            image: "../assets/fourth-picture.jpg",
            link: "gallerydescriptionpages/fourthpicture.html",
            text: "Bild 4"
        }
    ];

    // Hash beim Laden auslesen
    let currentIndex = parseInt(window.location.hash.replace("#", "")) || 0;

    const galleryImage = document.getElementById("galleryImage");
    const galleryCaption = document.getElementById("galleryCaption");
    const galleryLink = document.getElementById("galleryLink");

    function updateGallery() {
        if (!galleryImage || !galleryLink) return;

        galleryImage.src = galleryItems[currentIndex].image;
        galleryLink.href = galleryItems[currentIndex].link;

        if (galleryCaption) {
            galleryCaption.textContent = galleryItems[currentIndex].text;
        }

        // Hash in URL speichern
        history.replaceState(null, "", "#" + currentIndex);
    }

    window.nextImage = function () {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        updateGallery();
    };

    window.prevImage = function () {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        updateGallery();
    };

    // Galerie beim Laden initialisieren
    updateGallery();

});