package com.example.bvtv_www.config;

import com.example.bvtv_www.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security Configuration
 * =====================
 * Phân quyền theo vai trò:
 * - GUEST: Xem sản phẩm, danh mục, tạo đơn hàng (không cần đăng nhập)
 * - CUSTOMER: Xem đơn hàng của mình, quản lý profile
 * - STAFF: Quản lý đơn hàng, sản phẩm, khách hàng (không quản lý user và cấu hình hệ thống)
 * - ADMIN: Toàn quyền
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final CustomUserDetailsService userDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(jwtTokenProvider, userDetailsService);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> {}) // Enable CORS với config từ CorsConfig.java
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(exceptionHandling -> 
                exceptionHandling.authenticationEntryPoint(jwtAuthenticationEntryPoint)
            )
            .sessionManagement(sessionManagement -> 
                sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS) // ✅ Stateless - không dùng session
            )
            .authorizeHttpRequests(auth -> auth
                // ============================================================
                // AUTH ENDPOINTS - Public access
                // ============================================================
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/auth/status").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/chat").permitAll()
                
                // ============================================================
                // GUEST - Public read access (không cần đăng nhập)
                // ============================================================
                .requestMatchers(HttpMethod.GET, "/api/product-units/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/payment-methods/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/coupons/validate/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/areas/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/store-settings/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/orders/lookup/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/orders").permitAll() // Guest tạo đơn
                
                // ============================================================
                // CUSTOMER - Authenticated users (đã đăng nhập)
                // ============================================================
                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/orders/my-orders").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/profiles/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/profiles/me").authenticated()
                
                // ============================================================
                // STAFF - Limited management (Orders, Customers, Inventory)
                // ============================================================
                // Orders management (STAFF + ADMIN)
                .requestMatchers(HttpMethod.GET, "/api/orders/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/orders/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/orders/**").hasRole("ADMIN")
                
                // Customer/Profile management (STAFF + ADMIN)
                .requestMatchers(HttpMethod.GET, "/api/profiles").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/profiles").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/profiles/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/profiles/**").hasRole("ADMIN")
                
                // Inventory movements management (STAFF + ADMIN)
                .requestMatchers(HttpMethod.GET, "/api/inventory-movements/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/inventory-movements/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/inventory-movements/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/inventory-movements/**").hasRole("ADMIN")
                
                // Area management (STAFF + ADMIN)
                .requestMatchers(HttpMethod.POST, "/api/areas/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/areas/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/areas/**").hasRole("ADMIN")
                
                // ============================================================
                // ADMIN ONLY - Full system management
                // ============================================================
                // Product management (ADMIN only)
                .requestMatchers(HttpMethod.POST, "/api/product-units/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/product-units/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/product-units/**").hasRole("ADMIN")
                
                // Category management (ADMIN only)
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")
                
                // Coupon management (ADMIN only)
                .requestMatchers(HttpMethod.POST, "/api/coupons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/coupons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/coupons/**").hasRole("ADMIN")
                
                // Warehouse management - STAFF can view, only ADMIN can create/edit/delete
                .requestMatchers(HttpMethod.GET, "/api/warehouses/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/warehouses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/warehouses/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/warehouses/**").hasRole("ADMIN")
                
                // ============================================================
                // WAREHOUSE DOCUMENTS - Staff can manage, Admin can approve/delete
                // ============================================================
                // Goods Receipts - Phiếu Nhập Hàng (PNH)
                .requestMatchers(HttpMethod.GET, "/api/goods-receipts/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/goods-receipts").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/goods-receipts/*").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/goods-receipts/*/confirm").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/goods-receipts/*/cancel").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/goods-receipts/**").hasRole("ADMIN")
                
                // Customer Returns - Phiếu Trả Hàng (PTH)
                .requestMatchers(HttpMethod.GET, "/api/customer-returns/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/customer-returns").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/customer-returns/*").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/customer-returns/*/approve").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/customer-returns/*/reject").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/customer-returns/*/cancel").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/customer-returns/**").hasRole("ADMIN")
                
                // Supplier Returns - Phiếu Trả Hàng NCC (PTHNCC)
                .requestMatchers(HttpMethod.GET, "/api/supplier-returns/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/supplier-returns").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/supplier-returns/*").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/supplier-returns/*/approve").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/supplier-returns/*/reject").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/supplier-returns/*/cancel").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/supplier-returns/**").hasRole("ADMIN")
                
                // Store settings (ADMIN only)
                .requestMatchers(HttpMethod.POST, "/api/store-settings/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/store-settings/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/store-settings/**").hasRole("ADMIN")
                
                // Default: require authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider()) // Sử dụng custom UserDetailsService
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class) // ✅ Thêm JWT filter
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable());
        
        return http.build();
    }
}
