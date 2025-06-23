declare module 'permitio' {
    export class Permit {
        constructor(config: { pdp: string; token: string });
        check(user: string, action: string, resource: string): Promise<boolean>;
        api: {
            syncUser(user: {
                key: string;
                email: string;
                first_name?: string;
                last_name?: string;
            }): Promise<any>;
            assignRole(params: {
                user: string;
                role: string;
                tenant: string;
            }): Promise<any>;
        };
    }
}
