// missions-config.js
// Configuration file for Cherry Hills Church Missions Globe

const MISSIONS_CONFIG = {
    // Cesium Ion access token
    cesiumToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1OWNhMDFjNi0wZTQ5LTRhMTQtYjVlOC0xZDExMDNjNTlmNjMiLCJpZCI6MzIwMTI0LCJpYXQiOjE3NTIxMTA1OTV9._asU_UV5t-_Z4Wx_VWoLS0-fg5T-GqrrrAzgTh75W-o',
    
    // Camera settings
    camera: {
        initialView: {
            // Centered on USA
            longitude: -98.5795,
            latitude: 39.8283,
            altitude: 16500000,
            heading: 0,
            pitch: -90,
            roll: 0
        },
        flyDuration: 3.0, // seconds
        groupingAltitude: 2000000 // meters - altitude above which to show grouped markers
    },
    
    // Region definitions
    regions: {
        springfield: {
            bounds: {
                west: -89.7501,
                south: 39.5,
                east: -89.4877,
                north: 39.87
            },
            center: {
                lng: -89.6501,
                lat: 39.7817
            },
            label: 'Local',
            labelOffset: { x: 0, y: 20 } // Pixel offset for label
        },
        regional: {
            bounds: {
                west: -89.40329365428762,
                south: 40.3,
                east: -87.62502145653507,
                north: 41.95
            },
            // Center is calculated automatically
            label: 'Regional',
            labelOffset: { x: 0, y: -30 } // Move up more to avoid overlap
        }
    },
    
    // Mission categories with styling
    categories: {
        local: {
            color: '#4CAF50',
            icon: '🏠',
            pinScale: 0.8,
            groupScale: 1.2
        },
        regional: {
            color: '#2196F3',
            icon: '🌎',
            pinScale: 0.8,
            groupScale: 1.2
        },
        global: {
            color: '#FF9800',
            icon: '🌍',
            pinScale: 0.8,
            groupScale: 1.0
        }
    },
    
    // Globe settings
    globe: {
        enableLighting: true,
        enableAtmosphere: true,
        enableFog: true,
        fogDensity: 0.0001,
        lightingFadeOutDistance: 1000000,
        lightingFadeInDistance: 3000000
    },
    
    // UI settings
    ui: {
        showStats: true,
        showInfoPanel: true,
        animationDuration: 300, // milliseconds
        fonts: {
            primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            labelSize: '16px',
            labelWeight: 'bold',
            groupLabelSize: '20px'
        }
    },
    
    // Label styling
    labels: {
        font: 'bold 16px Arial',
        fillColor: '#FFFFFF',
        outlineColor: '#000000',
        outlineWidth: 3,
        pixelOffset: { x: 0, y: 10 },
        scaleByDistance: {
            near: 150,
            nearScale: 1.0,
            far: 20000000,
            farScale: 0.7
        },
        translucencyByDistance: {
            near: 1500000,
            nearAlpha: 1.0,
            far: 5000000,
            farAlpha: 0.0
        }
    },
    
    // Billboard (pin) settings
    billboards: {
        pinWidth: 48,
        pinHeight: 64,
        scaleByDistance: {
            near: 150,
            nearScale: 1.0,
            far: 20000000,
            farScale: 0.4
        }
    },
    
    // Data source
    dataSource: 'missions.json',
    
    // Error messages
    messages: {
        loadingError: 'Error loading missions data',
        cesiumError: 'Error initializing 3D globe',
        fullscreenError: 'Fullscreen request failed'
    }
};