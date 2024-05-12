# Participantes
ALAN BILLY BATEN GUIGUI 	9490-22-17906 ponderacion 100%
Diego Antonio Beteta García 	9490-22-12878 ponderacion 100%

# Creador de Matriz Dispersa con CSV

Este programa permite cargar datos desde un archivo CSV o agregarlos manualmente, visualizar los datos y generar una representación visual de una matriz dispersa utilizando la biblioteca Graphviz.

## Objetivo
El objetivo de este trabajo es proporcionar una herramienta simple para cargar datos desde un archivo CSV, visualizarlos y generar una representación visual de una matriz dispersa.

## Ejecución del Programa
1. Clona o descarga este repositorio en tu máquina local.
2. Asegúrate de tener Python instalado en tu sistema.
3. Instala las dependencias necesarias ejecutando `pip install graphviz`.
4. Ejecuta el programa desde la línea de comandos utilizando el comando `python nombre_del_programa.py`.
5. Sigue las instrucciones en pantalla para cargar datos desde un archivo CSV, agregar datos manualmente, visualizar los datos o generar la representación visual de la matriz dispersa.

## Representación Visual de la Matriz Dispersa
La representación visual de la matriz dispersa se genera utilizando la biblioteca Graphviz. Cada nodo en el gráfico representa un elemento no nulo en la matriz, y las aristas representan la relación de vecindad entre los elementos. El gráfico se guarda como un archivo de imagen en formato JPG en la ruta del proyecto.

## Tipo de Matriz Dispersa Implementada
El programa implementa una matriz dispersa utilizando una lista de listas en Python. Cada lista interna representa una fila de la matriz, y los elementos no nulos se almacenan como cadenas de texto.

## Información Adicional
- El programa maneja errores como la falta de archivo especificado, errores al cargar el archivo CSV y errores al generar la representación visual de la matriz dispersa.
- La generación del gráfico puede fallar si la matriz tiene un tamaño incorrecto o si hay otros problemas relacionados con la generación del gráfico.
