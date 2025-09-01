<script lang="ts" module>
	export function logOut() {
		fetch("/logout", { method: "POST" })
			.then(() => {
				route.navigate("/auth");
			})
			.catch((err) => {
				console.error("Logout failed:", err);
			});
	}
</script>

<script lang="ts">
  	import { reconnectSocket } from "../stores/sync";
	import { route } from "../stores/router";

	let username = "";
	let password = "";
	let error = "";
	let loading = false;

	async function handleLogin() {
		if(!username.trim() || !password.trim()) {
			error = "Please enter both username and password";
			return;
		}

		loading = true;
		error = "";

		try {
			const response = await fetch("/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			if(response.ok) {
				// Successful login - redirect to home
				reconnectSocket();
				route.navigate("/");
			} else {
				// Login failed
				const errorText = await response.text();
                console.error("Login failed:", errorText);
				error = errorText;
			}
		} catch (err) {
			error = "Network error. Please try again.";
			console.error("Login error:", err);
		} finally {
			loading = false;
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if(event.key === "Enter") handleLogin();
	}
</script>

<div class="auth-container">
	<div class="auth-card">
		<div class="auth-header">
			<h1>Organizer</h1>
			<p>Login or something idk</p>
		</div>

		<form class="auth-form" onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}

			<div class="form-group">
				<label for="username">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					onkeypress={handleKeyPress}
					disabled={loading}
					autocomplete="username"
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					onkeypress={handleKeyPress}
					disabled={loading}
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="login-button blue" disabled={loading}>
				{loading ? "Signing in..." : "Sign In"}
			</button>
		</form>
	</div>
</div>

<style lang="scss">
	.auth-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background-color: var(--background);
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		background-color: var(--surface-0);
		border: 2px solid var(--surface-1-border);
		border-radius: 8px;
		padding: 1rem 1.5rem 1.5rem 1.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	}

	.auth-header {
		text-align: center;
		margin-bottom: 1rem;
        
        h1 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--color-text);
        }
        
        p {
            margin: 0;
            color: var(--subtle-text);
            font-size: 0.9rem;
        }
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
        
        label {
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--color-important-text);
        }

        input {
            padding: 0.5rem;
            font-size: 1rem;
            border-radius: 6px;
            transition: border-color 100ms, opacity 100ms;
            
            &:disabled {
                opacity: 0.6;
            }
        }
	}

	.login-button {
		padding: 0.5rem 1.5rem;
		font-size: 1rem;
		font-weight: 500;
		border-radius: 6px;
		margin-top: 0.5rem;
		transition: opacity 100ms;
        
        &:disabled {
            opacity: 0.6;
        }
	}

	.error-message {
		padding: 0.5rem 0.75rem;
		background-color: var(--red-background);
		color: var(--color-text);
		border-radius: 5px;
		font-size: 0.9rem;
		text-align: center;
		border: 1px solid var(--red-text);
	}
</style>