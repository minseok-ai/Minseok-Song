import katex from "katex";

export const eq1Latex = String.raw`\begin{gathered}
\vec{v}_{\text{step}} = \operatorname{Norm}\left( w_{\text{in}} \cdot (-\vec{n}_0) + w_{\text{bias}} \cdot \vec{B}_{\text{spike}}(\mathbf{S}) \right) \\[6pt]
\vec{B}_{\text{spike}}(\mathbf{S}) = \frac{\sum_{j=1}^4 (h_j + s_j) \cdot \hat{p}_j}{\sum_{j=1}^4 (h_j + s_j)} - \vec{d}_0
\end{gathered}`;

export const eq2Latex = String.raw`\begin{gathered}
(b_x, b_y, b_z) = \left\lfloor \frac{\vec{p}}{\Delta g} \right\rceil \implies 
\begin{cases}
\Delta h_k = I_{\text{score}} \cdot \left(0.55 + \left(1 - \frac{r_k}{R_{\text{field}}}\right)\right) \\[4pt]
\Delta s_k = \gamma_{\text{gain}} \cdot \max\left(0.2, \ \frac{r_k}{R_{\text{field}}}\right) \\[4pt]
\Delta M_k = I_{\text{score}}
\end{cases}
\end{gathered}`;

export const eq3Latex = String.raw`\begin{gathered}
\vec{C}_{\text{mass}} = \frac{\sum_k M_k \cdot \vec{p}_k}{\sum_k M_k}, \quad \vec{D}_{\text{drift}}(t) = \vec{C}_{\text{mass}}(t) - \vec{C}_{\text{mass}}(t-1) \\[6pt]
\mathcal{S}_{\text{stability}} = \frac{h_{\text{dominant}}}{\sum_{j=1}^6 h_j + \epsilon} \in [0, 1]
\end{gathered}`;

export const eq4Latex = String.raw`\begin{gathered}
s_k(t+1) = s_k(t) \cdot (1 - \delta_{\text{base}}) \\[4pt]
h_k(t+1) = h_k(t) \cdot (1 - \delta_{\text{spike}}) \cdot \begin{cases} 0.92 & \text{if } s_k < s_{\text{floor}} \\ 1.0 & \text{otherwise} \end{cases}
\end{gathered}`;

export const eq1Html = katex.renderToString(eq1Latex, { displayMode: true, output: "html", throwOnError: false });
export const eq2Html = katex.renderToString(eq2Latex, { displayMode: true, output: "html", throwOnError: false });
export const eq3Html = katex.renderToString(eq3Latex, { displayMode: true, output: "html", throwOnError: false });
export const eq4Html = katex.renderToString(eq4Latex, { displayMode: true, output: "html", throwOnError: false });
