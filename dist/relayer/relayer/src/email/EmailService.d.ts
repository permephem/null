export interface EmailConfig {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
}
export declare class EmailService {
    constructor(_config: EmailConfig);
    sendDeletionConfirmation(to: string, subject: string, warrantId: string, deletionStatus: string): Promise<boolean>;
    sendErrorNotification(to: string, error: string, context: Record<string, any>): Promise<boolean>;
}
//# sourceMappingURL=EmailService.d.ts.map