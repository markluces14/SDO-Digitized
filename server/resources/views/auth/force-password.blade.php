<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <title>Change Password</title>
    <style>
        body {
            font-family: Arial;
            background: #f4f6ff;
            padding: 40px;
        }

        .card {
            max-width: 420px;
            margin: auto;
            background: #fff;
            padding: 18px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, .08);
        }

        label {
            display: block;
            margin-top: 12px;
            font-size: 13px;
        }

        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 10px;
        }

        button {
            margin-top: 16px;
            width: 100%;
            padding: 10px;
            border: 0;
            border-radius: 10px;
            background: #0b2b4a;
            color: #fff;
            cursor: pointer;
        }

        .err {
            color: #b00020;
            font-size: 12px;
            margin-top: 6px;
        }
    </style>
</head>

<body>
    <div class="card">
        <h3>Change your password</h3>
        <p style="margin:0;color:#555;font-size:13px;">
            For security, you must change your password before continuing.
        </p>

        <form method="POST" action="{{ route('password.force.update') }}">
            @csrf

            <label>Current Password</label>
            <input type="password" name="current_password">
            @error('current_password')
                <div class="err">{{ $message }}</div>
            @enderror

            <label>New Password</label>
            <input type="password" name="password">
            @error('password')
                <div class="err">{{ $message }}</div>
            @enderror

            <label>Confirm New Password</label>
            <input type="password" name="password_confirmation">

            <button type="submit">Update Password</button>
        </form>
    </div>
</body>

</html>
