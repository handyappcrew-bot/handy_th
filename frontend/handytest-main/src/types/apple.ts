declare global {
    interface Window {
        AppleID: {
            auth: {
                init: (config: {
                    clientId: string;
                    scope: string;
                    redirectURI: string;
                    usePopup: boolean;
                }) => void;
                signIn: () => Promise<{
                    authorization: {
                        code: string;
                        id_token: string;
                        state: string;
                    };
                }>;
            };
        };
    }
}

export { };