const { Resend } = require('resend');

const resend = new Resend(
    process.env.RESEND_API_KEY
);

const sendPasswordResetEmail = async (
    email,
    name,
    resetUrl
) => {

    const { data, error } = await resend.emails.send({

        from:
            process.env.EMAIL_FROM ||
            'Habit Builder <onboarding@resend.dev>',

        to: [email],

        subject: 'Reset your Habit Builder password',

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 30px;
                color: #222;
            ">

                <h2>
                    Reset your Habit Builder password
                </h2>

                <p>
                    Hi ${name || 'there'},
                </p>

                <p>
                    We received a request to reset the password
                    for your Habit Builder account.
                </p>

                <p>
                    Click the button below to create a new password.
                </p>

                <div style="margin: 30px 0;">

                    <a
                        href="${resetUrl}"
                        style="
                            display: inline-block;
                            padding: 12px 22px;
                            background: #5b5bd6;
                            color: white;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: 600;
                        "
                    >
                        Reset Password
                    </a>

                </div>

                <p>
                    This link will expire in 15 minutes.
                </p>

                <p>
                    If you didn't request a password reset,
                    you can safely ignore this email.
                </p>

                <p style="
                    margin-top: 30px;
                    color: #777;
                    font-size: 13px;
                ">
                    Habit Builder
                </p>

            </div>
        `
    });

    if (error) {
        console.error(
            'Resend email error:',
            error
        );

        throw new Error(
            'Failed to send password reset email'
        );
    }

    return data;
};

module.exports = {
    sendPasswordResetEmail
};