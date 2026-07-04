document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');
    
    mobileMenuBtn.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        this.querySelector('i').classList.toggle('fa-times');
        this.querySelector('i').classList.toggle('fa-bars');
    });
    
    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navMenu.classList.remove('active');
                mobileMenuBtn.querySelector('i').classList.remove('fa-times');
                mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            }
        });
    });
    
    // Sticky Header
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    });
    
    // Back to Top Button
    const backToTopBtn = document.querySelector('.back-to-top');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    });
    
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Testimonial Slider
    const testimonials = document.querySelectorAll('.testimonial');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    let currentTestimonial = 0;
    
    function showTestimonial(index) {
        testimonials.forEach(testimonial => testimonial.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        testimonials[index].classList.add('active');
        dots[index].classList.add('active');
        currentTestimonial = index;
    }
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            showTestimonial(index);
        });
    });
    
    prevBtn.addEventListener('click', function() {
        currentTestimonial = (currentTestimonial - 1 + testimonials.length) % testimonials.length;
        showTestimonial(currentTestimonial);
    });
    
    nextBtn.addEventListener('click', function() {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    });
    
    // Auto-rotate testimonials
    let testimonialInterval = setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }, 5000);
    
    // Pause auto-rotation on hover
    const testimonialSlider = document.querySelector('.testimonial-slider');
    testimonialSlider.addEventListener('mouseenter', function() {
        clearInterval(testimonialInterval);
    });
    
    testimonialSlider.addEventListener('mouseleave', function() {
        testimonialInterval = setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        }, 5000);
    });
    
    // Portfolio Filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');
            portfolioItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
    
    // Check URL for filter parameter
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam) {
        const filterBtn = document.querySelector(`.filter-btn[data-filter="${filterParam}"]`);
        if (filterBtn) {
            filterBtn.click();
        }
    }
    
    // Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value;
            
            // Create WhatsApp message
            let whatsappMessage = `Hello Shachavir Timber,\n\n`;
            whatsappMessage += `I'd like to inquire about your services.\n\n`;
            whatsappMessage += `Name: ${name}\n`;
            whatsappMessage += `Phone: ${phone}\n`;
            if (email) whatsappMessage += `Email: ${email}\n`;
            if (service) whatsappMessage += `Service: ${document.getElementById('service').options[document.getElementById('service').selectedIndex].text}\n`;
            whatsappMessage += `Message: ${message}\n\n`;
            whatsappMessage += `Please get back to me with more information. Thank you!`;
            
            // Encode message for URL
            const encodedMessage = encodeURIComponent(whatsappMessage);
            
            // Open WhatsApp with prefilled message
            window.open(`https://wa.me/254721499606?text=${encodedMessage}`, '_blank');
            
            // Reset form
            contactForm.reset();
            
            // Show success message
            alert('Thank you for your message! You will now be redirected to WhatsApp to continue the conversation.');
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Initialize lightbox if it exists on the page
    if (typeof lightbox !== 'undefined') {
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'showImageNumberLabel': false
        });
    }
});

const menuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('nav ul');
menuBtn.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
    document.querySelector('nav ul').classList.toggle('active');
});

document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navMenu = document.querySelector('nav ul');

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
    // Optional: close menu when a link is clicked
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
});

// Make sure to include this script after your testimonials HTML or at the end of the body

document.addEventListener('DOMContentLoaded', function () {
    const testimonials = document.querySelectorAll('.testimonial-slider .testimonial');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const dots = document.querySelectorAll('.slider-dots .dot');
    let current = 0;

    function updateTestimonials() {
        testimonials.forEach((t, i) => {
            t.classList.remove('active', 'left', 'right');
            if (i === current) {
                t.classList.add('active');
            } else if (i === (current - 1 + testimonials.length) % testimonials.length) {
                t.classList.add('left');
            } else if (i === (current + 1) % testimonials.length) {
                t.classList.add('right');
            }
        });
        if (dots.length) {
            dots.forEach((d, i) => {
                d.classList.toggle('active', i === current);
            });
        }
    }

    function goTo(idx) {
        current = (idx + testimonials.length) % testimonials.length;
        updateTestimonials();
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => goTo(current + 1));
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => goTo(current - 1));
    }
    if (dots.length) {
        dots.forEach((dot, i) => {
            dot.addEventListener('click', () => goTo(i));
        });
    }

    // Optional: auto-rotate every 6 seconds
    setInterval(() => goTo(current + 1), 6000);

    updateTestimonials();
});

document.addEventListener('DOMContentLoaded', function () {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    if (filterBtns.length && portfolioItems.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                // Remove active from all
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.getAttribute('data-filter');
                portfolioItems.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
        // Optionally, trigger the first filter on load
        filterBtns[0].click();
    }
});

// blog.js - JavaScript for Shachavir Timber Limited Blog Page

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.querySelector('i').classList.toggle('fa-times');
            this.querySelector('i').classList.toggle('fa-bars');
        });
    }

    // Category filtering
    const categoryLinks = document.querySelectorAll('.blog-categories a');
    const blogCards = document.querySelectorAll('.blog-card');
    
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            categoryLinks.forEach(item => item.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            const filter = this.getAttribute('href').substring(1);
            
            // Filter blog cards
            blogCards.forEach(card => {
                if (filter === 'all') {
                    card.style.display = 'block';
                } else {
                    const cardCategory = card.querySelector('.category').textContent.toLowerCase().replace(/\s+/g, '-');
                    if (cardCategory.includes(filter)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                }
            });
            
            // Scroll to blog section if not already visible
            const blogSection = document.querySelector('.blog-section');
            if (blogSection) {
                blogSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Back to top button
    const backToTopBtn = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    });
    
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Newsletter form submission
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email) {
                // Here you would typically send the email to your server
                // For now, we'll just show a success message
                alert('Thank you for subscribing to our newsletter!');
                emailInput.value = '';
            }
        });
    }

    // Smooth scrolling for all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Article read time calculation
    const articles = document.querySelectorAll('.blog-card');
    
    articles.forEach(article => {
        // This would normally be calculated based on actual content
        // For demo purposes, we'll generate random read times
        const readTime = Math.floor(Math.random() * 5) + 3; // 3-7 minutes
        const readTimeElement = document.createElement('span');
        readTimeElement.className = 'read-time';
        readTimeElement.innerHTML = `&nbsp;• ${readTime} min read`;
        
        const metaElement = article.querySelector('.blog-meta');
        if (metaElement) {
            metaElement.appendChild(readTimeElement);
        }
    });

    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('.blog-image img');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            // Store the original src in data-src
            img.dataset.src = img.src;
            // Set a placeholder or empty src
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f5f5dc"/%3E%3C/svg%3E';
            imageObserver.observe(img);
        });
    }

    // Featured article carousel (if you want to rotate featured articles)
    const featuredArticles = document.querySelectorAll('.blog-card.featured');
    let currentFeaturedIndex = 0;
    
    if (featuredArticles.length > 1) {
        setInterval(() => {
            featuredArticles[currentFeaturedIndex].classList.remove('active');
            currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredArticles.length;
            featuredArticles[currentFeaturedIndex].classList.add('active');
        }, 8000); // Rotate every 8 seconds
    }

    // Add hover effect to topic cards
    const topicCards = document.querySelectorAll('.topic-card');
    
    topicCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });

    // Initialize lightbox for blog images (if you're using lightbox2)
    if (typeof lightbox !== 'undefined') {
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true,
            'albumLabel': 'Image %1 of %2'
        });
    }
});