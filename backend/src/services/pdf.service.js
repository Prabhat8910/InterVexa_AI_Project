import PDFDocument from 'pdfkit';
export const generatePDFReport = (report, candidateName) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));
            // Header Banner
            doc.fillColor('#4F46E5').fontSize(26).text('InterVexa AI', { align: 'center' });
            doc.fillColor('#4B5563').fontSize(10).text('AI-Powered Placement Preparation Platform', { align: 'center' });
            // Divider
            doc.moveDown(0.5);
            doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(1.5);
            // Report Title
            doc.fillColor('#1F2937').fontSize(16).text('INTERVIEW EVALUATION REPORT', { characterSpacing: 1 });
            doc.fillColor('#6B7280').fontSize(10).text(`Candidate Name: ${candidateName}`);
            doc.text(`Date of Session: ${new Date(report.createdAt).toLocaleDateString()}`);
            doc.moveDown(1.5);
            // Scores Panel
            doc.fillColor('#111827').fontSize(12).text('Performance Scores Breakdown', { underline: true });
            doc.moveDown(0.5);
            // Draw a grey card background for scores
            const startY = doc.y;
            doc.rect(50, startY, 500, 110).fill('#F9FAFB');
            doc.fillColor('#111827');
            doc.text(`Overall Placement Readiness Score:  ${report.overallScore}%`, 70, startY + 15);
            doc.text(`Technical Competence Score:           ${report.technicalScore}%`, 70, startY + 35);
            doc.text(`Communication Quality Score:           ${report.communicationScore}%`, 70, startY + 55);
            doc.text(`Speech Confidence Rating:               ${report.confidenceScore}%`, 70, startY + 75);
            doc.text(`Grammar and Voice Fluency:            ${report.grammarScore}%`, 70, startY + 95);
            // Reset Y cursor position after drawing block
            doc.y = startY + 130;
            // Strengths & Focus Areas Section
            doc.fillColor('#111827').fontSize(12).text('Key Strengths Identified', { underline: true });
            doc.moveDown(0.5);
            report.strengths.forEach(strength => {
                doc.fillColor('#1F2937').fontSize(10).text(`• ${strength}`);
            });
            doc.moveDown(1.5);
            doc.fillColor('#111827').fontSize(12).text('Weaknesses & Critical Gap Areas', { underline: true });
            doc.moveDown(0.5);
            report.weaknesses.forEach(weakness => {
                doc.fillColor('#1F2937').fontSize(10).text(`• ${weakness}`);
            });
            doc.moveDown(2);
            // Page Break for transcripts
            doc.addPage();
            // Q&A Transcript analysis
            doc.fillColor('#111827').fontSize(14).text('Turn-by-Turn Question Evaluation', { underline: true });
            doc.moveDown(1);
            report.expectedAnswersComparison.forEach((qa, idx) => {
                doc.fillColor('#4F46E5').fontSize(11).text(`Question ${idx + 1}: ${qa.question}`);
                doc.moveDown(0.2);
                doc.fillColor('#1F2937').fontSize(10).text('Given Answer: ', { continued: true })
                    .fillColor('#374151').text(`"${qa.givenAnswer}"`);
                doc.moveDown(0.2);
                doc.fillColor('#059669').fontSize(10).text('Expected Better Answer Spec: ', { continued: true })
                    .fillColor('#047857').text(`"${qa.expectedBetterAnswer}"`);
                doc.moveDown(0.3);
                doc.fillColor('#B45309').fontSize(10).text('AI Advisor Suggestion: ', { continued: true })
                    .fillColor('#92400E').text(qa.evaluationFeedback);
                // Divider
                doc.moveDown(0.8);
                doc.strokeColor('#F3F4F6').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
                doc.moveDown(0.8);
            });
            // Recommended Learning Resources
            doc.moveDown(1);
            doc.fillColor('#111827').fontSize(12).text('Recommended Learning Material', { underline: true });
            doc.moveDown(0.5);
            report.recommendedResources.forEach(res => {
                doc.fillColor('#4F46E5').fontSize(10).text(`• [${res.type.toUpperCase()}] ${res.title}`);
                if (res.url) {
                    doc.fillColor('#6B7280').fontSize(8).text(`  Link: ${res.url}`);
                }
                doc.moveDown(0.3);
            });
            // End Document
            doc.end();
        }
        catch (error) {
            reject(error);
        }
    });
};
export default generatePDFReport;
