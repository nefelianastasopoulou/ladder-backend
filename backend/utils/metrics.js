/**
 * Basic Application Metrics
 * Simple in-memory metrics collection for monitoring
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {}
      },
      uptime: {
        startTime: Date.now()
      }
    };
  }

  // Record a request
  recordRequest(method, endpoint, statusCode, responseTime) {
    this.metrics.requests.total++;
    
    // By method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    
    // By endpoint
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
    
    // By status
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1;
    
    // Response time
    this.metrics.responseTime.total += responseTime;
    this.metrics.responseTime.count++;
    this.metrics.responseTime.average = this.metrics.responseTime.total / this.metrics.responseTime.count;
    this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, responseTime);
    this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, responseTime);
  }

  // Record an error
  recordError(errorType, endpoint) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
    this.metrics.errors.byEndpoint[endpoint] = (this.metrics.errors.byEndpoint[endpoint] || 0) + 1;
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      uptime: {
        ...this.metrics.uptime,
        current: Date.now() - this.metrics.uptime.startTime
      }
    };
  }

  // Get summary metrics
  getSummary() {
    const uptime = Date.now() - this.metrics.uptime.startTime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      uptime: `${uptimeHours}h ${uptimeMinutes}m`,
      totalRequests: this.metrics.requests.total,
      averageResponseTime: Math.round(this.metrics.responseTime.average || 0),
      errorRate: this.metrics.requests.total > 0 
        ? Math.round((this.metrics.errors.total / this.metrics.requests.total) * 100) 
        : 0,
      topEndpoints: Object.entries(this.metrics.requests.byEndpoint)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([endpoint, count]) => ({ endpoint, count }))
    };
  }

  // Reset metrics (useful for testing)
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {}
      },
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {}
      },
      uptime: {
        startTime: Date.now()
      }
    };
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

// Middleware to collect request metrics
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    metricsCollector.recordRequest(req.method, req.path, res.statusCode, responseTime);
    originalEnd.apply(this, args);
  };
  
  next();
};

// Error tracking middleware
const errorMetricsMiddleware = (err, req, res, next) => {
  const errorType = err.name || 'UnknownError';
  metricsCollector.recordError(errorType, req.path);
  next(err);
};

module.exports = {
  metricsCollector,
  metricsMiddleware,
  errorMetricsMiddleware
};
