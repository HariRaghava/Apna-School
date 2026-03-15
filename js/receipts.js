/* ============================================
   APNA SCHOOL - Fee Receipt Generator
   Professional receipt with verification
   ============================================ */

const Receipts = {
    // School branding
    schoolName: 'APNA SCHOOL',
    schoolAddress: 'Tumkur, Karnataka, India',
    schoolPhone: '+91 1234567890',
    schoolEmail: 'accounts@apnaschool.edu.in',
    bankDetails: 'State Bank of India, A/C: 12345678901, IFSC: SBIN0001234',

    // Generate receipt number
    async generateReceiptNumber() {
        return await DB.generateReceiptNumber();
    },

    // Generate verification code
    generateVerificationCode() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `VRF-${random}-${timestamp.slice(-4)}`;
    },

    // Generate barcode-like pattern
    generateBarcode(code, width = 200, height = 40) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFF';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#000';
        let x = 10;

        for (let i = 0; i < code.length * 2; i++) {
            const barWidth = (code.charCodeAt(i % code.length) % 4) + 1;
            if (i % 2 === 0) {
                ctx.fillRect(x, 5, barWidth, height - 10);
            }
            x += barWidth + 1;
        }

        // Add code text below
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(code, width / 2, height - 2);

        return canvas.toDataURL();
    },

    // Create fee receipt
    async createReceipt(feeId, paymentData) {
        await DB.ready();

        const fee = await DB.get('fees', feeId);
        if (!fee) throw new Error('Fee record not found');

        const student = await DB.get('students', fee.studentId);
        if (!student) throw new Error('Student not found');

        const receiptNumber = await this.generateReceiptNumber();
        const verificationCode = this.generateVerificationCode();
        const user = Auth.currentUser();

        const receipt = {
            receiptNumber,
            studentId: student.id,
            feeId: feeId,
            amount: paymentData.amount,
            paymentMode: paymentData.paymentMode,
            paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
            transactionId: paymentData.transactionId || null,
            status: 'Valid',
            remarks: paymentData.remarks || '',
            collectedBy: user?.userId || 'admin',
            verificationCode
        };

        await DB.add('feeReceipts', receipt, user?.userId);

        // Update fee record
        const newPaidAmount = (fee.paidAmount || 0) + paymentData.amount;
        const newBalance = fee.totalAmount - newPaidAmount;

        await DB.update('fees', {
            ...fee,
            paidAmount: newPaidAmount,
            balance: newBalance,
            status: newBalance <= 0 ? 'Paid' : 'Partial',
            lastPaymentDate: paymentData.paymentDate
        }, user?.userId);

        return receipt;
    },

    // Verify receipt
    async verifyReceipt(receiptNumber) {
        await DB.ready();

        const receipts = await DB.getAll('feeReceipts');
        const receipt = receipts.find(r => r.receiptNumber === receiptNumber);

        if (!receipt) {
            return { valid: false, message: 'Receipt not found', receipt: null };
        }

        const student = await DB.get('students', receipt.studentId);

        return {
            valid: receipt.status === 'Valid',
            message: receipt.status === 'Valid' ? 'Receipt is valid' : `Receipt is ${receipt.status}`,
            receipt: {
                ...receipt,
                studentName: student?.name || 'Unknown',
                studentRollNo: student?.rollNo || '-'
            }
        };
    },

    // Cancel receipt
    async cancelReceipt(receiptNumber, reason) {
        await DB.ready();

        const receipts = await DB.getAll('feeReceipts');
        const receipt = receipts.find(r => r.receiptNumber === receiptNumber);

        if (!receipt) {
            throw new Error('Receipt not found');
        }

        if (receipt.status === 'Cancelled') {
            throw new Error('Receipt is already cancelled');
        }

        const user = Auth.currentUser();

        // Update receipt status
        await DB.update('feeReceipts', {
            ...receipt,
            status: 'Cancelled',
            cancelledBy: user?.userId,
            cancelledAt: new Date().toISOString(),
            cancelReason: reason
        }, user?.userId);

        // Revert fee payment
        const fee = await DB.get('fees', receipt.feeId);
        if (fee) {
            const newPaidAmount = Math.max(0, (fee.paidAmount || 0) - receipt.amount);
            const newBalance = fee.totalAmount - newPaidAmount;

            await DB.update('fees', {
                ...fee,
                paidAmount: newPaidAmount,
                balance: newBalance,
                status: newPaidAmount === 0 ? 'Pending' : 'Partial'
            }, user?.userId);
        }

        return true;
    },

    // Generate receipt HTML
    async generateReceiptHTML(receiptNumber) {
        const verification = await this.verifyReceipt(receiptNumber);
        if (!verification.receipt) throw new Error('Receipt not found');

        const receipt = verification.receipt;
        const student = await DB.get('students', receipt.studentId);
        const cls = student ? await DB.get('classes', student.classId) : null;
        const barcode = this.generateBarcode(receipt.receiptNumber);

        const isCancelled = receipt.status === 'Cancelled';

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Fee Receipt - ${receipt.receiptNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: #f5f5f5; 
            padding: 20px;
          }
          .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border: 2px solid ${isCancelled ? '#FF5A5A' : '#00D9A5'};
            position: relative;
            overflow: hidden;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: ${isCancelled ? 'rgba(255, 90, 90, 0.1)' : 'rgba(0, 217, 165, 0.05)'};
            font-weight: bold;
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
          }
          .content { position: relative; z-index: 1; }
          .header {
            background: linear-gradient(135deg, ${isCancelled ? '#FF5A5A' : '#00D9A5'}, ${isCancelled ? '#FF8888' : '#4DE3FF'});
            color: white;
            padding: 20px;
            text-align: center;
          }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { opacity: 0.9; font-size: 12px; }
          .receipt-title {
            background: #0A0F2C;
            color: white;
            text-align: center;
            padding: 10px;
            font-size: 16px;
            font-weight: bold;
          }
          .receipt-number {
            background: #f9f9f9;
            text-align: center;
            padding: 15px;
            border-bottom: 1px dashed #ddd;
          }
          .receipt-number .number {
            font-size: 24px;
            font-weight: bold;
            color: #5A3FFF;
            font-family: monospace;
          }
          .details {
            padding: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-row .label { color: #666; }
          .detail-row .value { font-weight: 600; color: #333; }
          .amount-box {
            background: linear-gradient(135deg, #5A3FFF, #4DE3FF);
            color: white;
            padding: 20px;
            text-align: center;
            margin: 0 20px 20px;
            border-radius: 10px;
          }
          .amount-box .label { opacity: 0.8; font-size: 14px; }
          .amount-box .amount { font-size: 36px; font-weight: bold; margin-top: 5px; }
          .barcode-section {
            text-align: center;
            padding: 15px;
            border-top: 1px dashed #ddd;
          }
          .barcode-section img { max-width: 100%; }
          .verification-code {
            font-family: monospace;
            background: #f0f0f0;
            padding: 5px 15px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 10px;
            font-size: 12px;
          }
          .footer {
            background: #f9f9f9;
            padding: 15px;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          .cancelled-stamp {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 60px;
            color: rgba(255, 90, 90, 0.3);
            font-weight: bold;
            border: 5px solid rgba(255, 90, 90, 0.3);
            padding: 10px 30px;
            z-index: 2;
          }
          @media print {
            body { padding: 0; background: white; }
            .receipt { border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="watermark">${isCancelled ? 'CANCELLED' : 'PAID'}</div>
          ${isCancelled ? '<div class="cancelled-stamp">CANCELLED</div>' : ''}
          <div class="content">
            <div class="header">
              <h1>🎓 ${this.schoolName}</h1>
              <p>${this.schoolAddress} | ${this.schoolPhone}</p>
            </div>
            
            <div class="receipt-title">
              FEE PAYMENT RECEIPT
            </div>

            <div class="receipt-number">
              <div>Receipt No.</div>
              <div class="number">${receipt.receiptNumber}</div>
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="label">Student Name</span>
                <span class="value">${receipt.studentName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Roll Number</span>
                <span class="value">${receipt.studentRollNo}</span>
              </div>
              <div class="detail-row">
                <span class="label">Class</span>
                <span class="value">${cls?.name || '-'}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment Date</span>
                <span class="value">${new Date(receipt.paymentDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment Mode</span>
                <span class="value">${receipt.paymentMode}</span>
              </div>
              ${receipt.transactionId ? `
              <div class="detail-row">
                <span class="label">Transaction ID</span>
                <span class="value">${receipt.transactionId}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Status</span>
                <span class="value" style="color: ${receipt.status === 'Valid' ? '#00D9A5' : '#FF5A5A'};">
                  ${receipt.status}
                </span>
              </div>
            </div>

            <div class="amount-box">
              <div class="label">Amount Paid</div>
              <div class="amount">₹${receipt.amount.toLocaleString('en-IN')}</div>
            </div>

            <div class="barcode-section">
              <img src="${barcode}" alt="Barcode">
              <div class="verification-code">${receipt.verificationCode}</div>
            </div>

            <div class="footer">
              <p>This is a computer-generated receipt and does not require a signature.</p>
              <p style="margin-top: 10px;">${this.bankDetails}</p>
              <p style="margin-top: 5px;">For queries: ${this.schoolEmail}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    },

    // Generate and open receipt
    async generate(receiptNumber) {
        try {
            const html = await this.generateReceiptHTML(receiptNumber);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            return true;
        } catch (error) {
            console.error('Error generating receipt:', error);
            Utils.showToast('Error generating receipt: ' + error.message, 'error');
            return false;
        }
    },

    // Print receipt
    async print(receiptNumber) {
        const success = await this.generate(receiptNumber);
        if (success) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }
};

// Make available globally
window.Receipts = Receipts;
