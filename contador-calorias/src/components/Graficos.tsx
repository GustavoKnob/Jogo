import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { formatarNumero } from '../lib/calculos';
import { cores } from '../lib/tema';

const ALTURA = 160;
// No navegador o SVG usa fonte serifada por padrão.
const FONTE = Platform.OS === 'web' ? 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' : undefined;

/** Barras diárias com linha tracejada da meta. */
export function GraficoBarras({
  dados,
  meta,
}: {
  dados: { rotulo: string; valor: number; destaque?: boolean }[];
  meta?: number;
}) {
  const [largura, setLargura] = useState(0);
  const max = Math.max(meta ?? 0, ...dados.map((d) => d.valor), 1) * 1.1;
  const passo = largura / Math.max(dados.length, 1);
  const larguraBarra = Math.min(28, passo * 0.6);
  const y = (v: number) => ALTURA - (v / max) * ALTURA;
  const mostrarRotulo = (i: number) => dados.length <= 10 || i % Math.ceil(dados.length / 7) === 0;

  return (
    <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      {largura > 0 && (
        <Svg width={largura} height={ALTURA + 22}>
          {dados.map((d, i) => {
            const h = (d.valor / max) * ALTURA;
            const acima = meta !== undefined && d.valor > meta;
            return (
              <Rect
                key={i}
                x={i * passo + (passo - larguraBarra) / 2}
                y={ALTURA - h}
                width={larguraBarra}
                height={Math.max(h, d.valor > 0 ? 2 : 0)}
                rx={Math.min(6, larguraBarra / 2)}
                fill={acima ? cores.aviso : cores.primaria}
                opacity={d.destaque === false ? 0.5 : 1}
              />
            );
          })}
          {meta !== undefined && (
            <Line x1={0} x2={largura} y1={y(meta)} y2={y(meta)} stroke={cores.textoSuave} strokeDasharray="4 4" />
          )}
          {dados.map((d, i) =>
            mostrarRotulo(i) ? (
              <SvgText
                key={`r${i}`}
                x={i * passo + passo / 2}
                y={ALTURA + 16}
                fontSize={11} fontFamily={FONTE}
                fill={cores.textoSuave}
                textAnchor="middle"
              >
                {d.rotulo}
              </SvgText>
            ) : null,
          )}
        </Svg>
      )}
    </View>
  );
}

/** Linha de peso ao longo do tempo. */
export function GraficoLinha({ pontos, meta }: { pontos: { rotulo: string; valor: number }[]; meta?: number }) {
  const [largura, setLargura] = useState(0);
  if (pontos.length === 0) return null;
  const valores = pontos.map((p) => p.valor).concat(meta !== undefined ? [meta] : []);
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (max - min < 2) {
    min -= 1;
    max += 1;
  }
  const margem = 12;
  const x = (i: number) => (pontos.length === 1 ? largura / 2 : margem + (i * (largura - 2 * margem)) / (pontos.length - 1));
  const y = (v: number) => 10 + (1 - (v - min) / (max - min)) * (ALTURA - 20);

  return (
    <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      {largura > 0 && (
        <Svg width={largura} height={ALTURA + 22}>
          {meta !== undefined && (
            <>
              <Line x1={0} x2={largura} y1={y(meta)} y2={y(meta)} stroke={cores.primaria} strokeDasharray="4 4" />
              <SvgText x={largura - 4} y={y(meta) - 4} fontSize={11} fontFamily={FONTE} fill={cores.primaria} textAnchor="end">
                {`meta ${formatarNumero(meta, 1)} kg`}
              </SvgText>
            </>
          )}
          <Polyline
            points={pontos.map((p, i) => `${x(i)},${y(p.valor)}`).join(' ')}
            fill="none"
            stroke={cores.prot}
            strokeWidth={2.5}
          />
          {pontos.map((p, i) => (
            <Circle key={i} cx={x(i)} cy={y(p.valor)} r={3.5} fill={cores.prot} />
          ))}
          <SvgText x={x(0)} y={ALTURA + 16} fontSize={11} fontFamily={FONTE} fill={cores.textoSuave} textAnchor="start">
            {pontos[0].rotulo}
          </SvgText>
          {pontos.length > 1 && (
            <SvgText x={x(pontos.length - 1)} y={ALTURA + 16} fontSize={11} fontFamily={FONTE} fill={cores.textoSuave} textAnchor="end">
              {pontos.at(-1)!.rotulo}
            </SvgText>
          )}
        </Svg>
      )}
    </View>
  );
}

/** Anel de progresso simples (consumido / meta). */
export function Anel({ valor, total, tamanho = 120, cor = cores.primaria, children }: {
  valor: number;
  total: number;
  tamanho?: number;
  cor?: string;
  children?: React.ReactNode;
}) {
  const espessura = 10;
  const r = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(valor / total, 1) : 0;
  const passou = total > 0 && valor > total;
  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamanho} height={tamanho} style={{ position: 'absolute' }}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={r} stroke="#E8ECEA" strokeWidth={espessura} fill="none" />
        <Circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={r}
          stroke={passou ? cores.perigo : cor}
          strokeWidth={espessura}
          fill="none"
          strokeDasharray={`${circ * pct} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: cor }} />
      <Text style={{ color: cores.textoSuave, fontSize: 13 }}>{texto}</Text>
    </View>
  );
}
