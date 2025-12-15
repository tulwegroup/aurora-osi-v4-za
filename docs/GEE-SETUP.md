# 🛰️ Google Earth Engine Setup Guide

This guide helps you configure Aurora OSI v4.5 to use real satellite data from Google Earth Engine instead of synthetic mock data.

## 🚀 Quick Setup

### 1. Access Settings
1. Navigate to the Aurora OSI v4.5 dashboard
2. Click the **Settings** button in the top-right corner
3. You'll see the current data source status (Mock Data Active by default)

### 2. Configure Google Earth Engine

#### Option A: Upload Service Account Key
1. Go to the **Google Earth Engine** tab in Settings
2. Enter your **Project ID** (e.g., `my-gee-project-12345`)
3. Either:
   - **Paste** your service account JSON directly into the text area, OR
   - **Upload** your service account JSON file using the file picker
4. Click **"Test GEE Connection"** to validate credentials

#### Option B: Get GEE Credentials (If you don't have them)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Earth Engine API**
4. Create a service account:
   - Go to IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Give it a name (e.g., "aurora-osi-service")
   - Grant it "Earth Engine Admin" role
5. Generate and download the JSON key file

### 3. Test Connection
1. After entering credentials, click **"Test GEE Connection"**
2. You should see:
   - ✅ **Success**: "Google Earth Engine connection successful!"
   - ❌ **Error**: Detailed error message if credentials are invalid

### 4. Apply Settings
1. Once connection test passes, click **"Apply Settings"**
2. The system will switch to using real satellite data
3. Status indicator will change to **"Real Data Active"**

### 5. Configure Data Sources (Optional)
Go to the **Data Sources** tab to configure:
- **Primary Data Source**: Choose between Mock, Real GEE, or Hybrid
- **Mock Fallback**: Enable mock data if GEE fails
- **Data Caching**: Cache GEE results for faster repeat queries
- **Cache Duration**: Set how long to cache data (1-168 hours)

## 📊 Data Source Comparison

| Feature | Mock Data | Real GEE Data |
|---------|------------|----------------|
| **Response Time** | Instant | 2-10 seconds |
| **Data Accuracy** | Synthetic patterns | Real satellite measurements |
| **Coverage** | Global | Actual satellite coverage |
| **Cost** | Free | GEE quota usage |
| **Reliability** | 100% uptime | Depends on GEE service |
| **Update Frequency** | Static | Real satellite overpasses |

## 🎯 Using Real Data

Once configured with real GEE credentials:

### Campaign Creation
- All new campaigns will use **real satellite data**
- Gravity data comes from actual GOCE/GRACE measurements
- Spectral data from real Sentinel-2/Landsat 8 imagery
- Elevation data from actual SRTM measurements

### Consensus Evaluation
- Agents process **real measurements** instead of synthetic data
- More accurate anomaly detection
- Real temporal analysis with actual satellite overpasses
- Physics-based validation with real-world constraints

### Expected Results
- **Fewer false positives** due to real data validation
- **More accurate predictions** based on actual measurements
- **Realistic uncertainty estimates** from sensor limitations
- **Temporal coherence** from actual time series data

## 🔧 System Configuration

### Advanced Settings
In the **System** tab, you can configure:
- **Consensus Threshold**: Adjust agreement requirement (50-100%)
- **Agent Veto Power**: Enable/disable physics-based veto
- **Processing Timeout**: Set maximum processing time (30-600 seconds)

### Performance Tips
1. **Enable Caching**: Reduces GEE API calls and costs
2. **Use Hybrid Mode**: Real data with mock fallback for reliability
3. **Monitor Quota**: Check GEE usage in Google Cloud Console
4. **Batch Processing**: Create multiple campaigns to maximize API efficiency

## 🚨 Troubleshooting

### Common Issues

#### "Connection Test Failed"
- **Check Project ID**: Ensure it matches your GEE project exactly
- **Verify Service Account**: JSON should be complete and unmodified
- **API Enabled**: Ensure Earth Engine API is enabled in Google Cloud
- **Permissions**: Service account needs "Earth Engine Admin" role

#### "Settings Applied but Still Using Mock Data"
- **Refresh Browser**: Settings may need page reload to take effect
- **Check Logs**: Look for GEE initialization errors in browser console
- **Re-test Connection**: Try testing connection again

#### "High API Costs"
- **Enable Caching**: Reduces repeated API calls
- **Reduce Area Size**: Smaller campaign areas use less quota
- **Longer Time Ranges**: Fewer, larger composite images

### Getting Help
1. **Check Console**: Browser console shows detailed error messages
2. **Review Logs**: System logs show GEE connection status
3. **Validate Credentials**: Test service account in GEE Code Editor
4. **Check Quotas**: Monitor usage in Google Cloud Console

## 📈 Performance Expectations

### With Real GEE Data:
- **Initial Loading**: 5-15 seconds for first data fetch
- **Subsequent Queries**: 2-5 seconds with caching enabled
- **Anomaly Detection**: Higher accuracy with real measurements
- **Prediction Quality**: More reliable forecasts
- **System Load**: Higher due to real data processing

### Resource Usage:
- **Memory**: 2-4GB during real data processing
- **Network**: 10-50MB per campaign for satellite data
- **CPU**: Higher usage for real data analysis
- **Storage**: Cache files for processed satellite data

## 🎉 Success Indicators

When properly configured, you'll see:
- ✅ **Green "Real Data Active"** badge in settings
- ✅ **GEE connection successful** message
- ✅ **Real satellite data** in consensus evaluation results
- ✅ **Accurate coordinates** matching actual satellite overpasses
- ✅ **Realistic uncertainty** based on sensor specifications

---

**🛰️ Ready to use real satellite data!** 

Configure your GEE credentials and experience the full power of Aurora OSI v4.5 with actual Earth observation data.