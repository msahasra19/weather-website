const Query = require('../models/Query');
const { Parser } = require('json2csv');
const { XMLBuilder } = require('fast-xml-parser');
const PDFDocument = require('pdfkit');

// GET /api/export
exports.exportQueries = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;

    // Fetch all queries from database sorted by creation
    const queries = await Query.find({}).sort({ createdAt: -1 });

    if (!queries || queries.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'No search history data found to export',
        code: 404
      });
    }

    const dataPlain = queries.map(q => q.toObject());

    switch (format.toLowerCase()) {
      case 'csv': {
        const fields = [
          { label: 'Original Search Location', value: 'location' },
          { label: 'Resolved City Name', value: 'resolvedCity' },
          { label: 'Latitude', value: 'lat' },
          { label: 'Longitude', value: 'lon' },
          { label: 'From Date', value: (row) => row.dateFrom ? new Date(row.dateFrom).toISOString().split('T')[0] : '' },
          { label: 'To Date', value: (row) => row.dateTo ? new Date(row.dateTo).toISOString().split('T')[0] : '' },
          { label: 'Query Notes', value: 'notes' },
          { label: 'Saved At', value: (row) => row.createdAt ? new Date(row.createdAt).toISOString() : '' }
        ];
        
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(dataPlain);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=weather_history_export.csv');
        return res.status(200).send(csv);
      }

      case 'xml': {
        const builder = new XMLBuilder({
          format: true,
          ignoreAttributes: false,
          suppressEmptyNode: true
        });
        
        // Structure the XML correctly
        const xmlPayload = {
          weatherReport: {
            generatedAt: new Date().toISOString(),
            recordsCount: dataPlain.length,
            queries: {
              query: dataPlain.map(q => ({
                id: q._id.toString(),
                location: q.location,
                resolvedCity: q.resolvedCity,
                latitude: q.lat,
                longitude: q.lon,
                dateFrom: q.dateFrom ? new Date(q.dateFrom).toISOString().split('T')[0] : '',
                dateTo: q.dateTo ? new Date(q.dateTo).toISOString().split('T')[0] : '',
                notes: q.notes || '',
                createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : ''
              }))
            }
          }
        };

        const xmlString = builder.build(xmlPayload);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename=weather_history_export.xml');
        return res.status(200).send(xmlString);
      }

      case 'pdf': {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=weather_history_export.pdf');
        
        // Pipe the PDF directly into the HTTP response stream
        doc.pipe(res);

        // Header Title
        doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text('Weather Intelligence Report', { align: 'center' });
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(1.5);

        // Draw visual divider
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#cbd5e1').lineWidth(1).stroke();
        doc.moveDown(1.5);

        // Render records
        dataPlain.forEach((q, index) => {
          // Prevent overflow by adding a page break if needed
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.fillColor('#3b82f6').fontSize(12).font('Helvetica-Bold').text(`${index + 1}. Resolved Location: ${q.resolvedCity || q.location}`);
          
          doc.fillColor('#334155').fontSize(10).font('Helvetica');
          doc.text(`Search Term: "${q.location}"`);
          doc.text(`GPS Coordinates: Latitude ${q.lat || 'N/A'}, Longitude ${q.lon || 'N/A'}`);
          
          const fromStr = q.dateFrom ? new Date(q.dateFrom).toISOString().split('T')[0] : 'N/A';
          const toStr = q.dateTo ? new Date(q.dateTo).toISOString().split('T')[0] : 'N/A';
          doc.text(`Historical Period: ${fromStr} to ${toStr}`);
          
          if (q.notes) {
            doc.fillColor('#475569').text(`Notes: ${q.notes}`, { oblique: true });
          }

          if (q.weatherData && q.weatherData.length > 0) {
            const temps = q.weatherData.map(d => `${d.date}: ${d.minTemp}°C to ${d.maxTemp}°C (${d.description})`);
            doc.fillColor('#64748b').fontSize(9).text(`Historical Days Summary: ${temps.slice(0, 3).join(' | ')}${temps.length > 3 ? ' ...' : ''}`);
          }
          
          doc.moveDown(1);
          // Small horizontal separator
          doc.moveTo(40, doc.y).lineTo(300, doc.y).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
          doc.moveDown(0.8);
        });

        // Branding footer
        doc.moveDown(2);
        doc.fillColor('#94a3b8').fontSize(9).text('Powered by PM Accelerator & Open-Meteo API', { align: 'center' });

        doc.end();
        break;
      }

      case 'markdown': {
        let md = `# Weather Search History Report\n\n`;
        md += `*Generated on: ${new Date().toUTCString()}*\n\n`;
        md += `| # | Search Location | Resolved City | Latitude | Longitude | Date From | Date To | Notes |\n`;
        md += `|---|---|---|---|---|---|---|---|\n`;

        dataPlain.forEach((q, idx) => {
          const fromStr = q.dateFrom ? new Date(q.dateFrom).toISOString().split('T')[0] : 'N/A';
          const toStr = q.dateTo ? new Date(q.dateTo).toISOString().split('T')[0] : 'N/A';
          const notesStr = q.notes ? q.notes.replace(/\|/g, '\\|') : '';
          md += `| ${idx + 1} | **${q.location}** | ${q.resolvedCity || 'N/A'} | ${q.lat || 'N/A'} | ${q.lon || 'N/A'} | ${fromStr} | ${toStr} | ${notesStr} |\n`;
        });

        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename=weather_history_export.md');
        return res.status(200).send(md);
      }

      case 'json':
      default: {
        return res.status(200).json(queries);
      }
    }
  } catch (err) {
    next(err);
  }
};
