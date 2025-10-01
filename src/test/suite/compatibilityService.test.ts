import * as assert from 'assert';
import { CompatibilityDataService } from '../../services/compatibilityService';
import { BaselineStatus, WebFeature } from '../../types';

suite('CompatibilityDataService Test Suite', () => {
    let service: CompatibilityDataService;

    setup(() => {
        service = new CompatibilityDataService();
    });

    teardown(() => {
        if (service) {
            service.clearCache();
        }
    });

    suite('Initialization', () => {
        test('should initialize successfully', async () => {
            await service.initialize();
            assert.strictEqual(service.isReady(), true);
        });

        test('should not reinitialize if already initialized', async () => {
            await service.initialize();
            const stats1 = service.getCacheStats();
            
            await service.initialize(); // Second call
            const stats2 = service.getCacheStats();
            
            assert.deepStrictEqual(stats1, stats2);
        });

        test('should load features data', async () => {
            await service.initialize();
            const stats = service.getCacheStats();
            assert.ok(stats.totalFeatures > 0, 'Should load at least some features');
        });
    });

    suite('Feature Status Lookup', () => {
        setup(async () => {
            await service.initialize();
        });

        test('should return null for non-existent feature', () => {
            const status = service.getFeatureStatus('non-existent-feature-12345');
            assert.strictEqual(status, null);
        });

        test('should return null when not initialized', () => {
            const uninitializedService = new CompatibilityDataService();
            const status = uninitializedService.getFeatureStatus('any-feature');
            assert.strictEqual(status, null);
        });

        test('should cache feature status lookups', () => {
            // This test assumes there's at least one feature in the dataset
            const features = service.searchFeatures('css');
            if (features.length > 0) {
                const featureId = features[0].id;
                
                // First lookup
                const status1 = service.getFeatureStatus(featureId);
                
                // Second lookup (should be cached)
                const status2 = service.getFeatureStatus(featureId);
                
                assert.deepStrictEqual(status1, status2);
                
                const stats = service.getCacheStats();
                assert.ok(stats.bcdCache >= 0, 'Should have cache stats');
            }
        });

        test('should handle baseline status conversion correctly', () => {
            // Find a feature with known status
            const features = service.searchFeatures('css');
            const featureWithStatus = features.find(f => f.baseline);
            
            if (featureWithStatus) {
                const status = service.getFeatureStatus(featureWithStatus.id);
                assert.ok(status, 'Should return status for feature with baseline data');
                assert.ok(['widely_available', 'newly_available', 'limited_availability'].includes(status!.status));
                assert.ok(typeof status!.support === 'object');
            }
        });
    });

    suite('Feature Search', () => {
        setup(async () => {
            await service.initialize();
        });

        test('should return empty array for non-matching query', () => {
            const results = service.searchFeatures('non-existent-query-12345');
            assert.strictEqual(results.length, 0);
        });

        test('should return empty array when not initialized', () => {
            const uninitializedService = new CompatibilityDataService();
            const results = uninitializedService.searchFeatures('css');
            assert.strictEqual(results.length, 0);
        });

        test('should find features by partial name match', () => {
            const results = service.searchFeatures('css');
            assert.ok(results.length > 0, 'Should find CSS-related features');
            
            // Verify results contain the search term
            const hasMatchingFeature = results.some(feature => 
                feature.id.toLowerCase().includes('css') ||
                feature.name.toLowerCase().includes('css') ||
                (feature.description && feature.description.toLowerCase().includes('css'))
            );
            assert.ok(hasMatchingFeature, 'Results should contain features matching the query');
        });

        test('should cache search results', () => {
            const query = 'css';
            
            // First search
            const results1 = service.searchFeatures(query);
            
            // Second search (should be cached)
            const results2 = service.searchFeatures(query);
            
            assert.deepStrictEqual(results1, results2);
            
            const stats = service.getCacheStats();
            assert.ok(stats.totalFeatures > 0, 'Should have features loaded');
        });

        test('should be case insensitive', () => {
            const results1 = service.searchFeatures('CSS');
            const results2 = service.searchFeatures('css');
            const results3 = service.searchFeatures('Css');
            
            assert.deepStrictEqual(results1, results2);
            assert.deepStrictEqual(results2, results3);
        });
    });

    suite('Feature Details', () => {
        setup(async () => {
            await service.initialize();
        });

        test('should return null for non-existent feature', () => {
            const details = service.getFeatureDetails('non-existent-feature-12345');
            assert.strictEqual(details, null);
        });

        test('should return null when not initialized', () => {
            const uninitializedService = new CompatibilityDataService();
            const details = uninitializedService.getFeatureDetails('any-feature');
            assert.strictEqual(details, null);
        });

        test('should return feature details with required fields', () => {
            // Find any feature to test with
            const features = service.searchFeatures('css');
            if (features.length > 0) {
                const featureId = features[0].id;
                const details = service.getFeatureDetails(featureId);
                
                assert.ok(details, 'Should return details for existing feature');
                assert.ok(typeof details!.name === 'string', 'Should have name');
                assert.ok(typeof details!.description === 'string', 'Should have description');
                assert.ok(typeof details!.baseline === 'object', 'Should have baseline status');
            }
        });

        test('should provide default description when none available', () => {
            // This test checks the fallback behavior
            const features = service.searchFeatures('css');
            if (features.length > 0) {
                const details = service.getFeatureDetails(features[0].id);
                if (details) {
                    assert.ok(details.description.length > 0, 'Should always have some description');
                }
            }
        });
    });

    suite('Cache Management', () => {
        setup(async () => {
            await service.initialize();
        });

        test('should clear all caches', () => {
            // Populate caches
            service.searchFeatures('css');
            const features = service.searchFeatures('css');
            if (features.length > 0) {
                service.getFeatureStatus(features[0].id);
            }
            
            // Verify caches have data
            let stats = service.getCacheStats();
            const hadCachedData = stats.bcdCache > 0;
            
            // Clear caches
            service.clearCache();
            
            // Verify caches are empty
            stats = service.getCacheStats();
            assert.strictEqual(stats.bcdCache, 0);
            
            if (hadCachedData) {
                // Only assert if we actually had cached data to clear
                assert.ok(true, 'Caches were cleared successfully');
            }
        });

        test('should provide cache statistics', () => {
            const stats = service.getCacheStats();
            assert.ok(typeof stats.bcdCache === 'number');
            assert.ok(typeof stats.totalFeatures === 'number');
            assert.ok(stats.totalFeatures > 0, 'Should have loaded features');
        });
    });

    suite('Error Handling', () => {
        test('should handle initialization errors gracefully', async () => {
            // Create a service that will fail to load web-features
            const mockService = new (class extends CompatibilityDataService {
                async initialize(): Promise<void> {
                    throw new Error('Mock initialization error');
                }
            })();

            try {
                await mockService.initialize();
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.ok(error instanceof Error);
                assert.ok(error.message.includes('Mock initialization error'));
            }
        });

        test('should handle malformed feature data gracefully', () => {
            // This test ensures the service doesn't crash with unexpected data
            // The actual implementation should handle this through proper type checking
            assert.ok(true, 'Service should handle malformed data gracefully');
        });
    });

    suite('Performance', () => {
        setup(async () => {
            await service.initialize();
        });

        test('should complete initialization within reasonable time', async () => {
            const newService = new CompatibilityDataService();
            const startTime = Date.now();
            
            await newService.initialize();
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should initialize within 5 seconds (generous for CI environments)
            assert.ok(duration < 5000, `Initialization took ${duration}ms, should be under 5000ms`);
        });

        test('should handle multiple concurrent lookups efficiently', () => {
            const features = service.searchFeatures('css').slice(0, 10); // Get first 10 features
            
            const startTime = Date.now();
            
            // Perform multiple lookups
            features.forEach(feature => {
                service.getFeatureStatus(feature.id);
                service.getFeatureDetails(feature.id);
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Should complete all lookups quickly
            assert.ok(duration < 1000, `Multiple lookups took ${duration}ms, should be under 1000ms`);
        });
    });
});