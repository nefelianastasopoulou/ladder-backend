#!/bin/bash
# Production deployment script for Railway
cp package.prod.json package.json
npm install --production
